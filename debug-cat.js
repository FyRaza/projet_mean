require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const Product = require('./src/models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/mall_manage_db';

mongoose.connect(MONGO_URI).then(async () => {
  const cats = await Category.find({ type: 'product' }).select('_id slug name');
  console.log('=== Categories ===');
  cats.forEach(c => console.log(c._id.toString(), c.slug, c.name));

  const catId = cats[0]._id.toString();
  console.log('\n=== Testing filter with category ID:', catId, '===');
  console.log('isValidObjectId:', mongoose.isValidObjectId(catId));

  const categoryDoc = await Category.findById(catId).select('_id slug');
  console.log('Found category:', categoryDoc ? categoryDoc.slug : 'NOT FOUND');

  if (categoryDoc) {
    const filterVal = { $in: [String(categoryDoc._id), categoryDoc.slug] };
    console.log('Filter value:', JSON.stringify(filterVal));

    const products = await Product.find({ category: filterVal });
    console.log('Products with $in filter:', products.length);
    products.forEach(p => console.log(' -', p.name));
  }

  // Direct match test
  console.log('\n=== Direct string match test ===');
  const directProducts = await Product.find({ category: catId });
  console.log('Products with direct catId match:', directProducts.length);
  directProducts.forEach(p => console.log(' -', p.name));

  // Check raw values
  console.log('\n=== All products raw category field ===');
  const allProducts = await Product.find({}).select('name category');
  allProducts.forEach(p => {
    console.log(p.name, '| category:', JSON.stringify(p.category), '| type:', typeof p.category);
  });

  // Try ObjectId comparison
  console.log('\n=== ObjectId comparison ===');
  const prodCat = allProducts[0].category;
  console.log('Product category value:', prodCat);
  console.log('Category _id value:', catId);
  console.log('Are equal (===):', prodCat === catId);
  console.log('Product category type:', typeof prodCat);

  await mongoose.disconnect();
});
