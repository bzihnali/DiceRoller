const mongoose = require('mongoose');
const { TimeSeriesBucketTimestamp } = require('redis');
const _ = require('underscore');

const setName = (name) => _.escape(name).trim();

const DieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        set: setName,
    },
    age: {
        type: Number,
        min: 0,
        required: true,
    },
    level: {
        type: Number,
        min: 0,
        max: 100,
        default: 1,
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        required: true,
        ref: 'Account',
    },
    createdDate: {
        type: Date,
        default: Date.now,
    }
});

DieSchema.statics.toAPI = (doc) => ({
    name: doc.name,
    age: doc.age,
    level: doc.level,
});

const DieModel = mongoose.model('Die', DieSchema);
module.exports = DieModel;