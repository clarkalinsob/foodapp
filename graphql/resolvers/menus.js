const { AuthenticationError, UserInputError } = require("apollo-server");

const Menu = require("../../models/Menu");
const Food = require("../../models/Food");
const checkAuth = require("../../util/check-auth");

module.exports = {
    Query: {
        getMenus: async () => {
            try {
                const menus = await Menu.find().sort({
                    createdAt: -1
                });
                return menus;
            } catch (err) {
                throw new Error(err);
            }
        },

        getMenu: async (_, { menuId }) => {
            try {
                const menu = await Menu.findById(menuId);

                if (menu) {
                    return menu;
                } else throw new Error("Menu not found");
            } catch (err) {
                throw new Error(err);
            }
        }
    },

    Mutation: {
        createMenu: async (_, { body }, context) => {
            const { id, username } = checkAuth(context);

            if (body.trim() === "")
                throw new Error("Menu body must not be empty");

            const newMenu = new Menu({
                createdAt: new Date().toISOString(),
                body,
                username,
                _user: id
            });

            const menu = await newMenu.save();

            return menu;
        },

        deleteMenu: async (_, { menuId }, context) => {
            const { username } = checkAuth(context);

            try {
                const menu = await Menu.findById(menuId);

                if (username == menu.username) {
                    await menu.delete();
                    return "Menu deleted successfully";
                } else throw new AuthenticationError("Action not allowed");
            } catch (err) {
                throw new Error(err);
            }
        },

        createMeal: async (
            _,
            { menuId, meal: { date, foodName, _food } },
            context
        ) => {
            const { id, username } = checkAuth(context);

            if (foodName.trim() === "")
                throw new Error("Food must be provided");
            if (date.trim() === "") throw new Error("Date must be provided");

            const menu = await Menu.findById(menuId);

            if (menu) {
                menu.meals.unshift({
                    createdAt: new Date().toISOString(),
                    date,
                    foodName,
                    _food,
                    username,
                    _user: id
                });

                await menu.save();
                return menu;
            } else throw new UserInputError("Menu not found");
        },

        deleteMeal: async (_, { menuId, mealId }, context) => {
            const { username } = checkAuth(context);

            const menu = await Menu.findById(menuId);

            if (menu) {
                const mealIndex = menu.meals.findIndex(
                    meal => meal.id === mealId
                );

                menu.meals.splice(mealIndex, 1);
                await menu.save();
                return menu;
            } else throw new UserInputError("Menu not found");
        }
    }
};
