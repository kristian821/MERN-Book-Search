const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const revolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({})
                .select('-__v -password')
                .populate('savedBooks');

                return userData;
            }

            throw new AuthenticationError('Not logged in')
        }
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email })
            if (!user) {
                throw new AuthenticationError('Incorrect Credentials');
            }

            const correctPw = await user.isCorrectPassword(password);

            if (!correctPw) {
                throw new AuthenticationError('Incorret Password');
            }
            const token = signToken(user);
            return {token, user};
        },

        addUser: async (parent, args) => {
            const user = await User.create(args)
            const token = signToken(user);

            return {token, user};
        },
        
        saveBook: async (parent, args, context) => {
            if (context.user) {
                const book = await Book.create(args);

                const updatedUser =  await User.findOneAndUpdate(
                    {_id: context.user._id},
                    { $push: { savedBooks: book._id } },
                    {new: true}
                );

                return updatedUser;
            }

            throw new AuthenticationError('You need to be logged in');
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$pull: { savedBooks: bookId } },
                    {new: true}
                );

                return updatedUser;
            }

            throw new AuthenticationError('You need to be logged in');
        }
    }
}

module.exports = revolvers;