const models = require('../models');
const Roll = models.Roll;

const makerPage = async (req, res) => {
  return res.render('app');
};

const makeRoll = async (req, res) => {
  if (!req.body.rollstring) {
    return res.status(400).json({ error: 'Please input something!' });
  }

  const rollData = {
    rollstring: req.body.rollstring,
    owner: req.session.account._id,
  };

  try {
    const newRoll = new Roll(rollData);
    if (newRoll.parseRollString().length != 0) {
      await newRoll.save();
      return res.status(201).json({ rollstring: newRoll.rollstring });
    } else {
      return res.status(400).json({ error: 'Invalid rollstring!' });
    }
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Roll already exists!' });
    }
    return res.status(500).json({ error: 'An error occurred making roll!' });
  }
}

const getRolls = async (req, res) => {
  try {
    const query = { owner: req.session.account._id };
    const docs = await Roll.find(query).select('rollstring').lean().exec();

    return res.json({ rolls: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving rolls!' });
  }
};

const generateRollResults = async (req, res) => {
  try {
    const query = { owner: req.session.account._id, _id: req.body.id };
    const doc = await Roll.findOne(query);
    let diceResult = doc.rollDice();
    let valueRolled = diceResult.reduce((accum, a) => accum + a, 0);
    return res.status(200).json({
      rolls: diceResult, 
      rollTotal: valueRolled,
      rollPMF: doc.generatePMF(),
      rollMean: doc.getMean(),
      rollPercentile: doc.getPercentile(valueRolled),
      rollQuartiles: [doc.getPercentileValue(0.25), doc.getPercentileValue(0.75)],
      rollTenths: [doc.getPercentileValue(0.1), doc.getPercentileValue(0.9)]
    })
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error rolling dice!' });
  }
}

const deleteRoll = async (req, res) => {
  try {
    console.log(req.body)
    const query = { owner: req.session.account._id, _id: req.body.id };
    const result = await Roll.deleteOne(query);
    if (result.deletedCount == 1) {
      return res.status(200).json({ message: 'Roll successfully deleted!' });
    } else {
      return res.status(204).json({ message: 'Roll not found!' });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error deleting roll! (most likely invalid ID)' });
  }
}

module.exports = {
  makerPage,
  makeRoll,
  getRolls,
  deleteRoll,
  generateRollResults,
};