const models = require('../models');
const Domo = models.Domo;

const makerPage = async (req, res) => {
  return res.render('app');
};

const makeDomo = async (req, res) => {
  if (!req.body.name || !req.body.age) {
    return res.status(400).json({ error: 'Both name and age are required!' });
  }

  const domoData = {
    name: req.body.name,
    age: req.body.age,
    level: req.body.level ?? 1,
    owner: req.session.account._id,
  };

  try {
    const newDomo = new Domo(domoData);
    await newDomo.save();
    return res.status(201).json({ name: newDomo.name, age: newDomo.age, level: newDomo.level });
  } catch (err) {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Domo already exists!' });
    }
    return res.status(500).json({ error: 'An error occurred making domo!' });
  }
}

const getDomos = async (req, res) => {
  try {
    const query = { owner: req.session.account._id };
    const docs = await Domo.find(query).select('name age level').lean().exec();

    return res.json({ domos: docs });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error retrieving domos!' });
  }
};

const deleteDomo = async (req, res) => {
  try {
    console.log(req.body)
    const query = { owner: req.session.account._id, _id: req.body.id };
    const result = await Domo.deleteOne(query);
    if (result.deletedCount == 1) {
      return res.status(200).json({ message: 'Domo successfully deleted!' });
    } else {
      return res.status(204).json({ message: 'Domo not found!' });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Error deleting domo! (most likely invalid ID)' });
  }
}

module.exports = {
  makerPage,
  makeDomo,
  getDomos,
  deleteDomo,
};