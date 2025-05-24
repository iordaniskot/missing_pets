const Pet = require('../models/Pet');
const Report = require('../models/Report');
const { paginate, buildPaginationResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

exports.createPet = async (req, res, next) => {
  try {
    const { name, breed, height, weight, color, isOwnedByCreator = false } = req.body;
    
    // Get photo URLs from uploaded files
    const photos = req.files ? req.files.map(file => file.cdnUrl) : [];

    const pet = new Pet({
      createdBy: req.userId,
      name,
      breed,
      height,
      weight,
      color,
      photos,
      isOwnedByCreator
    });

    const savedPet = await pet.save();
    await savedPet.populate([
      { path: 'owner', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    const action = isOwnedByCreator ? 'owned pet created' : 'found pet reported';
    logger.info(`${action}: ${savedPet._id} by user ${req.userId}`);

    res.status(201).json({
      message: `Pet ${isOwnedByCreator ? 'created' : 'reported'} successfully`,
      pet: savedPet
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllPets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { name, breed, color, hasOwner } = req.query;

    let query = Pet.find().populate([
      { path: 'owner', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);
    
    // Name filter
    if (name) {
      query = query.where('name').regex(new RegExp(name, 'i'));
    }
    
    // Breed filter
    if (breed) {
      query = query.where('breed').regex(new RegExp(breed, 'i'));
    }
    
    // Color filter
    if (color) {
      query = query.where('color').regex(new RegExp(color, 'i'));
    }
    
    // Filter by ownership status
    if (hasOwner !== undefined) {
      if (hasOwner === 'true') {
        query = query.where('owner').ne(null);
      } else if (hasOwner === 'false') {
        query = query.where('owner').equals(null);
      }
    }

    const total = await Pet.countDocuments(query.getFilter());
    const pets = await paginate(query, page, limit);

    res.status(200).json(
      buildPaginationResponse(pets, page, limit, total)
    );
  } catch (error) {
    next(error);
  }
};

exports.getPetById = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id).populate([
      { path: 'owner', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);
      
    if (!pet) {
      const error = new Error('Pet not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      message: 'Pet retrieved successfully',
      pet
    });
  } catch (error) {
    next(error);
  }
};

exports.updatePet = async (req, res, next) => {
  try {
    const { name, breed, height, weight, color, isOwnedByCreator } = req.body;
    
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      const error = new Error('Pet not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user has permission to update (owner or creator)
    const canUpdate = pet.createdBy.toString() === req.userId || 
                     (pet.owner && pet.owner.toString() === req.userId);
    
    if (!canUpdate) {
      const error = new Error('Not authorized to update this pet');
      error.statusCode = 403;
      throw error;
    }

    if (name !== undefined) pet.name = name;
    if (breed !== undefined) pet.breed = breed;
    if (height !== undefined) pet.height = height;
    if (weight !== undefined) pet.weight = weight;
    if (color !== undefined) pet.color = color;
    
    // Handle ownership claim/unclaim
    if (isOwnedByCreator !== undefined && pet.createdBy.toString() === req.userId) {
      pet.isOwnedByCreator = isOwnedByCreator;
    }
    
    // Handle new photos
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => file.cdnUrl);
      pet.photos = [...pet.photos, ...newPhotos];
    }

    const updatedPet = await pet.save();
    await updatedPet.populate([
      { path: 'owner', select: 'name email' },
      { path: 'createdBy', select: 'name email' }
    ]);

    logger.info(`Pet updated: ${pet._id} by user ${req.userId}`);

    res.status(200).json({
      message: 'Pet updated successfully',
      pet: updatedPet
    });
  } catch (error) {
    next(error);
  }
};

exports.deletePet = async (req, res, next) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) {
      const error = new Error('Pet not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if user has permission to delete (owner or creator)
    const canDelete = pet.createdBy.toString() === req.userId || 
                     (pet.owner && pet.owner.toString() === req.userId);
    
    if (!canDelete) {
      const error = new Error('Not authorized to delete this pet');
      error.statusCode = 403;
      throw error;
    }

    // Delete associated reports
    await Report.deleteMany({ pet: req.params.id });
    
    // Delete pet
    await Pet.findByIdAndDelete(req.params.id);

    logger.info(`Pet deleted: ${pet._id} by user ${req.userId}`);

    res.status(200).json({
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};