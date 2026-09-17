const create = async (Model, req, res) => {
    try {
        const data = await Model.create(req.body);

        return res.status(201).json({
            success: true,
            message: "Created successfully",
            data,
        });
    } catch (error) {
        console.error("Create error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

const getAll = async (Model, req, res, options = {}) => {
    try {
        const data = await Model.findAll(options);

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Get all error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

const getById = async (Model, req, res) => {
    try {
        const { id } = req.params;

        const data = await Model.findByPk(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Get by id error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

const update = async (Model, req, res) => {
    try {
        const { id } = req.params;

        const data = await Model.findByPk(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }

        await data.update(req.body);

        return res.status(200).json({
            success: true,
            message: "Updated successfully",
            data,
        });
    } catch (error) {
        console.error("Update error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

const remove = async (Model, req, res) => {
    try {
        const { id } = req.params;

        const data = await Model.findByPk(id);

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "Record not found",
            });
        }

        await data.destroy();

        return res.status(200).json({
            success: true,
            message: "Deleted successfully",
        });
    } catch (error) {
        console.error("Delete error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
};