import mongoose from 'mongoose';
import * as db from '../src/db';

describe('db', () => {
  describe('getModelFromHandler', () => {
    it('should return a string', () => {
      const result = db.getModelFromHandler('addUser');
      expect(result).toBe('User');
    });
    it('should return a string (kebab case)', () => {
      const result = db.getModelFromHandler('add-user');
      expect(result).toBe('User');
    });
    it('should return null for single word name', () => {
      const result = db.getModelFromHandler('users');
      expect(result).toBe(null);
    });
  });

  describe('createMongooseModel', () => {
    it('should return a mongoose model', () => {
      mongoose.model('User', new mongoose.Schema({}));
      const result = db.createMongooseModel('User');
      expect(result?.modelName).toBe('User');
    });
    it('should return null if modelName is null', () => {
      let result = db.createMongooseModel();
      expect(result).toBeNull();
      result = db.createMongooseModel(null);
      expect(result).toBeNull();
    });
  });

  describe('createDbParams', () => {
    it('should return handler params for the handler', () => {
      const result = db.createDbParams(
        { handler: 'addUser', input: {} },
        'User',
      );
      expect(result.modelName).toBe('User');
      expect(result.model()?.modelName).toBe('User');
      expect(result.create).toBeInstanceOf(Function);
      expect(result.update).toBeInstanceOf(Function);
      expect(result.findById).toBeInstanceOf(Function);
    });
  });

  describe('initDb', () => {
    jest.mock('mongoose', () => ({
      connect: () => {},
    }));

    it('should initialize db connection', () => {
      const spy = jest
        .spyOn(mongoose, 'connect')
        .mockReturnValue(new Promise((resolve) => resolve(true as any)));
      db.initDb('foo');
      expect(spy).toHaveBeenCalledWith('foo');
    });
  });

  describe('initModels', () => {
    it('should create models', () => {
      const models = [
        {
          name: 'Blog',
          fields: {
            name: String,
          },
        },
      ];
      db.initModels(models);
      expect(() => mongoose.model('Blog')).not.toThrowError();
    });
  });
});
