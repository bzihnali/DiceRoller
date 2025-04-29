const mongoose = require('mongoose');
const _ = require('underscore');

const setName = (name) => _.escape(name).trim();
const setRollString = (rollstring) => rollstring;

const RollSchema = new mongoose.Schema({
  rollstring: {
    type: String,
    required: true,
    trim: true,
    set: setRollString,
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

RollSchema.methods.parseRollString = function () {
  const dicePattern = /\d+d(\d+|\[.*?\])/g;
  const parts = [];

  const matches = [...this.rollstring.matchAll(dicePattern)];

  // Strict validation: Check that the whole rollstring is valid
  let lastIndex = 0;

  for (const match of matches) {
    if (match.index !== lastIndex) {
      throw new Error(`Invalid input between positions ${lastIndex} and ${match.index}: "${this.rollstring.slice(lastIndex, match.index)}"`);
    }

    const count = parseInt(match[0].split('d')[0], 10);
    const sidesRaw = match[1];

    if (sidesRaw.startsWith('[')) {
      try {
        const sides = JSON.parse(sidesRaw);
        if (!Array.isArray(sides)) {
          throw new Error(`Custom sides must be an array: got ${sidesRaw}`);
        }
        parts.push({ count, sides });
      } catch (e) {
        throw new Error(`Failed to parse custom dice sides: ${sidesRaw}: ${e.message}`);
      }
    } else {
      const sides = parseInt(sidesRaw, 10);
      parts.push({ count, sides });
    }

    lastIndex = match.index + match[0].length;

    // After a valid dice chunk, expect either a '+' or end of string
    if (this.rollstring[lastIndex] === '+') {
      lastIndex += 1; // skip '+'
    }
  }

  // After all matches, if anything remains, it's invalid
  if (lastIndex !== this.rollstring.length) {
    throw new Error(`Unexpected trailing input at position ${lastIndex}: "${this.rollstring.slice(lastIndex)}"`);
  }

  return parts;
};

RollSchema.methods.generatePMF = function () {
  let totalPMF = {};
  const dice = this.parseRollString(this.rollstring);

  for (const die of dice) {
    const diePMF = {};
    if (Array.isArray(die.sides)) {
      for (const side of die.sides) {
        if (!(side in diePMF)) {
          diePMF[side] = 1;
        } else {
          diePMF[side] += 1;
        }
      }
    } else {
      for (let i = 1; i < die.sides + 1; i++) {
        diePMF[i] = 1;
      }
    }

    for (let i = 0; i < die.count; i++) {
      const convolvedPMF = {};
      if (i === 0 && Object.entries(totalPMF).length === 0) {
        totalPMF = diePMF;
      } else {
        for (const [aStr, countA] of Object.entries(totalPMF)) {
          const a = parseInt(aStr, 10);

          for (const [bStr, countB] of Object.entries(diePMF)) {
            const b = parseInt(bStr, 10);
            const sum = a + b;
            const count = countA * countB;

            convolvedPMF[sum] = (convolvedPMF[sum] || 0) + count;
          }
        }
        totalPMF = convolvedPMF;
      }
    }
  }

  return totalPMF;
};

RollSchema.methods.rollDice = function () {
  const total = 0;
  const rollArray = [];
  for (const die of this.parseRollString()) {
    let dieArray = [];
    if (Array.isArray(die.sides)) {
      dieArray = die.sides;
    } else {
      for (let i = 0; i < die.sides; i++) {
        dieArray.push(i + 1);
      }
    }

    for (let i = 0; i < die.count; i++) {
      rollArray.push(dieArray[Math.floor(Math.random() * dieArray.length)]);
    }
  }

  return rollArray;
};

RollSchema.methods.getPercentile = function (value) {
  let totalRolls = 0;
  let rollsBelow = 0;
  const pmf = this.generatePMF();
  for (const probKey in pmf) {
    if (pmf.hasOwnProperty(probKey)) {
      if (probKey <= value) {
        rollsBelow += pmf[probKey];
      }
      totalRolls += pmf[probKey];
    }
  }
  return 100 * rollsBelow / totalRolls;
};

RollSchema.methods.getMean = function () {
  const pmf = this.generatePMF();
  let result = 0;
  let totalRolls = 0;

  for (const probKey in pmf) {
    if (pmf.hasOwnProperty(probKey)) {
      totalRolls += pmf[probKey];
      result += probKey * pmf[probKey];
    }
  }

  const factor = 10 ** 8;
  result = Math.round(result / totalRolls * factor) / factor;

  return result;
};

RollSchema.methods.getPercentileValue = function (percentile) {
  if (percentile < 0 || percentile > 1) {
    throw new Error('Percentile must be between 0 and 1');
  }

  const pmf = this.generatePMF();
  const entries = [];

  // Turn PMF into sorted array of [value, frequency]
  for (const probKey in pmf) {
    if (pmf.hasOwnProperty(probKey)) {
      entries.push([parseInt(probKey, 10), pmf[probKey]]);
    }
  }

  entries.sort((a, b) => a[0] - b[0]); // Sort by roll value

  const totalRolls = entries.reduce((sum, [_, freq]) => sum + freq, 0);

  let cumulative = 0;
  for (const [value, freq] of entries) {
    cumulative += freq;

    if (cumulative / totalRolls >= percentile) {
      return value;
    }
  }

  // Edge case: if somehow not found, return largest value
  return entries[entries.length - 1][0];
};

RollSchema.methods.isValid = function () {
  return RollSchema.methods.parseRollString(this.rollstring).length != 0;
};

RollSchema.statics.toAPI = (doc) => ({
  rollstring: doc.rollstring,
});

const RollModel = mongoose.model('Roll', RollSchema);
module.exports = RollModel;
