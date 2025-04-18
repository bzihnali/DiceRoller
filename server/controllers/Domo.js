const models = require('../models');
const Die = models.Die;

const makerPage = async (req, res) => {
  return res.render('app');
};

const makeDie = async (req, res) => {
  if (!req.body.name || !req.body.age) {
    return res.status(400).json({ error: 'Both name and age are required!' });
  }

  const dieData = {
    name: req.body.name,
    age: req.body.age,
    level: req.body.level ?? 1,
    owner: req.session.account._id,
  };

  try {
    const newDie = new Die(dieData);
    await newDie.save();
    return res.status(201).json({ name: newDie.name, age: newDie.age, level: newDie.level });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Die already exists!' });
    }
    return res.status(500).json({ error: 'An error occurred making die!' });
  }
}

const getDice = async (req, res) => {
  try {
    const query = { owner: req.session.account._id };
    const docs = await Die.find(query).select('name age level').lean().exec();

    return res.json({ dice: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving dice!' });
  }
};

const deleteDie = async (req, res) => {
  try {
    console.log(req.body)
    const query = { owner: req.session.account._id, _id: req.body.id };
    const result = await Die.deleteOne(query);
    if (result.deletedCount == 1) {
      return res.status(200).json({ message: 'Die successfully deleted!' });
    } else {
      return res.status(204).json({ message: 'Die not found!' });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error deleting die! (most likely invalid ID)' });
  }
}

module.exports = {
  makerPage,
  makeDie,
  getDice,
  deleteDie,
};