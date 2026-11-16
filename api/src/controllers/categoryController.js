const asyncHandler = require('../utils/asyncHandler');
const Category = require('../models/Category');

const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const getPublishedCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isPublished: true }).sort('name');
  res.status(200).json({ success: true, count: categories.length, data: categories });
});

const getAllCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('-createdAt');
  res.status(200).json({ success: true, count: categories.length, data: categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, isPublished } = req.body;
  if (!name || !String(name).trim()) {
    const error = new Error('Category name is required');
    error.statusCode = 400;
    throw error;
  }
  const slug = slugify(req.body.slug || name);
  if (!slug) {
    const error = new Error('Invalid category name');
    error.statusCode = 400;
    throw error;
  }
  const exists = await Category.findOne({ slug });
  if (exists) {
    const error = new Error('Category already exists');
    error.statusCode = 400;
    throw error;
  }
  const category = await Category.create({ name: String(name).trim(), slug, isPublished: !!isPublished });
  res.status(201).json({ success: true, data: category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) { const e = new Error('Category name is required'); e.statusCode = 400; throw e; }
    category.name = name;
    if (!req.body.slug) category.slug = slugify(name);
  }
  if (req.body.slug !== undefined) {
    const slug = slugify(req.body.slug);
    if (!slug) { const e = new Error('Invalid slug'); e.statusCode = 400; throw e; }
    const exists = await Category.findOne({ slug, _id: { $ne: category._id } });
    if (exists) { const e = new Error('Category slug already exists'); e.statusCode = 400; throw e; }
    category.slug = slug;
  }
  if (req.body.isPublished !== undefined) category.isPublished = !!req.body.isPublished;
  await category.save();
  res.status(200).json({ success: true, data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    const error = new Error('Category not found');
    error.statusCode = 404;
    throw error;
  }
  await Category.deleteOne({ _id: category._id });
  res.status(200).json({ success: true, data: {} });
});

module.exports = { getPublishedCategories, getAllCategories, createCategory, updateCategory, deleteCategory };
