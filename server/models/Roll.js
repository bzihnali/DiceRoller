const mongoose = require('mongoose');

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

  const matches = Array.from(this.rollstring.matchAll(dicePattern));

  // Strict validation: Check that the whole rollstring is valid
  let lastIndex = 0;
  let totalSides = 0;
  
  matches.forEach((match) => {
    if (match.index !== lastIndex) {
      throw new Error(
        `Invalid input between positions ${lastIndex} and ${match.index}: "${this.rollstring.slice(
          lastIndex,
          match.index,
        )}"`,
      );
    }

    const count = parseInt(match[0].split('d')[0], 10);
    const sidesRaw = match[1];
    

    if (sidesRaw.startsWith('[')) {
      try {
        const sides = JSON.parse(sidesRaw);
        if (!Array.isArray(sides)) {
          throw new Error(`Custom sides must be an array: got ${sidesRaw}`);
        }
        totalSides += count * sides.length;
        parts.push({ count, sides });
      } catch (e) {
        throw new Error(`Failed to parse custom dice sides: ${sidesRaw}: ${e.message}`);
      }
    } else {
      const sides = parseInt(sidesRaw, 10);
      totalSides += count * sides;
      parts.push({ count, sides });
    }

    lastIndex = match.index + match[0].length;

    // After a valid dice chunk, expect either a '+' or end of string
    if (this.rollstring[lastIndex] === '+') {
      lastIndex += 1; // skip '+'
    }
  });

  // After all matches, if anything remains, it's invalid
  if (lastIndex !== this.rollstring.length) {
    throw new Error(
      `Unexpected trailing input at position ${lastIndex}: "${this.rollstring.slice(lastIndex)}"`,
    );
  }

  if (totalSides > 2048) {
    throw new Error(
      `Too many possibilities! The cap is 4096, your roll has ${totalSides}!`,
    );
  }

  return parts;
};

RollSchema.methods.generatePMF = function () {
  let totalPMF = {};
  const dice = this.parseRollString(this.rollstring);

  dice.forEach((die) => {
    const diePMF = {};

    if (Array.isArray(die.sides)) {
      die.sides.forEach((side) => {
        diePMF[side] = (diePMF[side] || 0) + 1;
      });
    } else {
      for (let i = 1; i <= die.sides; i++) {
        diePMF[i] = 1;
      }
    }

    for (let i = 0; i < die.count; i++) {
      const convolvedPMF = {};

      if (i === 0 && Object.entries(totalPMF).length === 0) {
        totalPMF = diePMF;
      } else {
        Object.entries(totalPMF).forEach(([aStr, countA]) => {
          const a = parseInt(aStr, 10);

          Object.entries(diePMF).forEach(([bStr, countB]) => {
            const b = parseInt(bStr, 10);
            const sum = a + b;
            const count = countA * countB;

            convolvedPMF[sum] = (convolvedPMF[sum] || 0) + count;
          });
        });

        totalPMF = convolvedPMF;
      }
    }
  });

  return totalPMF;
};

RollSchema.methods.rollDice = function () {
  const rollArray = [];
  const parsedDice = this.parseRollString();

  parsedDice.forEach((die) => {
    let dieArray = [];

    if (Array.isArray(die.sides)) {
      dieArray = die.sides;
    } else {
      // push numbers 1 through die.sides
      for (let i = 1; i <= die.sides; i++) {
        dieArray.push(i);
      }
    }

    for (let i = 0; i < die.count; i++) {
      const roll = dieArray[Math.floor(Math.random() * dieArray.length)];
      rollArray.push(roll);
    }
  });

  return rollArray;
};

RollSchema.methods.getPercentile = function (value) {
  let totalRolls = 0;
  let rollsBelow = 0;
  const pmf = this.generatePMF();

  Object.entries(pmf).forEach(([probKey, count]) => {
    const numericKey = parseInt(probKey, 10);

    if (numericKey <= value) {
      rollsBelow += count;
    }
    totalRolls += count;
  });

  return (100 * rollsBelow) / totalRolls;
};

RollSchema.methods.getMean = function () {
  const pmf = this.generatePMF();
  let result = 0;
  let totalRolls = 0;

  Object.entries(pmf).forEach(([probKey, count]) => {
    const numericKey = parseInt(probKey, 10);
    totalRolls += count;
    result += numericKey * count;
  });

  const factor = 10 ** 8;
  result = Math.round((result / totalRolls) * factor) / factor;

  return result;
};

RollSchema.methods.getPercentileValue = function (percentile) {
  if (percentile < 0 || percentile > 1) {
    throw new Error('Percentile must be between 0 and 1');
  }

  const pmf = this.generatePMF();

  // Convert PMF to sorted array of [value, frequency]
  const entries = Object.entries(pmf)
    .map(([key, freq]) => [parseInt(key, 10), freq])
    .sort((a, b) => a[0] - b[0]);

  const totalRolls = entries.reduce((sum, [, freq]) => sum + freq, 0);

  let cumulative = 0;
  let result = entries[entries.length - 1][0]; // default to max in case not found

  entries.some(([value, freq]) => {
    cumulative += freq;
    if (cumulative / totalRolls >= percentile) {
      result = value;
      return true; // break early
    }
    return false;
  });

  return result;
};

RollSchema.methods.isValid = function () {
  return RollSchema.methods.parseRollString(this.rollstring).length !== 0;
};

RollSchema.statics.toAPI = (doc) => ({
  rollstring: doc.rollstring,
});

const RollModel = mongoose.model('Roll', RollSchema);
module.exports = RollModel;
