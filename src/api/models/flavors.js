import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const schema = new Schema(
    {
        id: Number,
        flavor: String,
        categoryId: Number,
        toppings: [{ type: Number }],
        pageId: String,
    },
    { timestamps: true }
);

schema.index({ pageId: 1, id: 1 }, { unique: true });

export default mongoose.model('flavors', schema);
