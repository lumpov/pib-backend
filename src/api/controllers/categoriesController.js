
import Category from '../models/categories';
import util from 'util';
import { configSortQuery, configRangeQuery, configFilterQueryMultiple } from '../util/util';

// List all records
export const category_get_all = (req, res) => {
    // Getting the sort from the requisition
    let sortObj = req.query.sort ? configSortQuery(req.query.sort) : { name: 'ASC' };
    // Getting the range from the requisition
    let rangeObj = configRangeQuery(req.query.range);

    let queryObj = {};
    if (req.query.filter) {
        const filterObj = configFilterQueryMultiple(req.query.filter);

        if (filterObj && filterObj.filterField && filterObj.filterField.length) {
            for (let i = 0; i < filterObj.filterField.length; i++) {
                const filter = filterObj.filterField[i];
                const value = filterObj.filterValues[i];
                if (Array.isArray(value)) {
                    queryObj[filter] = { $in: value };
                } else
                    queryObj[filter] = value;
            }
        }
    }
    if (req.currentUser.activePage) {
        queryObj['pageId'] = req.currentUser.activePage;
    }

    Category.find(queryObj).sort(sortObj).exec((err, result) => {
        if (err) {
            res.status(500).json({ message: err.errmsg });
        } else {
            let _rangeIni = 0;
            let _rangeEnd = result.length;
            if (rangeObj) {
                _rangeIni = rangeObj.offset <= result.length ? rangeObj.offset : result.length;
                _rangeEnd = (rangeObj.offset + rangeObj.limit) <= result.length ? rangeObj.offset + rangeObj.limit : result.length;
            }
            let _totalCount = result.length;
            let responseArr = [];
            for (let i = _rangeIni; i < _rangeEnd; i++) {
                responseArr.push(result[i])
            }
            res.setHeader('Content-Range', util.format('categories %d-%d/%d', _rangeIni, _rangeEnd, _totalCount));
            res.status(200).json(responseArr);
        }
    });
};

// List one record by filtering by ID
export const category_get_one = (req, res) => {
    if (req.params && req.params.id) {
        // Filter based on the currentUser
        const pageId = req.currentUser.activePage;

        Category.findOne({ pageId: pageId, id: req.params.id }, (err, doc) => {
            if (err) {
                res.status(500).json({ message: err.errmsg });
            }
            else {
                res.status(200).json(doc);
            }
        });
    }
}

// CREATE A NEW RECORD
export const category_create = async (req, res) => {
    if (req.body) {

        const pageID = req.currentUser.activePage ? req.currentUser.activePage : null;

        let { id } = req.body;

        if (!id || id === 0) {
            const lastId = await Category.find({ pageId: pageID }).select('id').sort('-id').limit(1).exec();
            id = 1;
            if (lastId && lastId.length)
                id = lastId[0].id + 1;
        }

        const newRecord = new Category({
            id: id,
            name: req.body.name,
            price_by_size: req.body.price_by_size,
            is_pizza: req.body.is_pizza,
            pageId: pageID,
        });

        newRecord.save()
            .then((result) => {
                res.status(200).json(result);
            })
            .catch((err) => {
                res.status(500).json({ message: err.errmsg });
            });
    }
}

// UPDATE
export const category_update = (req, res) => {
    if (req.body && req.body.id) {

        const pageId = req.currentUser.activePage;

        Category.findOne({ pageId: pageId, id: req.body.id }, (err, doc) => {
            if (!err) {
                doc.name = req.body.name;
                doc.price_by_size = req.body.price_by_size;
                doc.is_pizza = req.body.is_pizza;
                doc.save((err, result) => {
                    if (err) {
                        res.status(500).json({ message: err.errmsg });
                    } else {
                        res.status(200).json(result);
                    }
                });
            } else {
                res.status(500).json({ message: err.errmsg });
            }
        });
    }
}

// DELETE
export const category_delete = (req, res) => {

    const pageId = req.currentUser.activePage;

    Category.findOneAndRemove({ pageId: pageId, id: req.params.id })
        .then((result) => {
            res.status(200).json(result);
        })
        .catch((err) => {
            res.status(500).json({ message: err.errmsg });
        });
};

/**
 * Delete all records from a pageID
 * @param {*} pageID
 */
export const deleteManyCategories = async (pageID) => {
    return await Category.deleteMany({ pageId: pageID }).exec();
}

export const getCategories = async (pageID) => {
    let query = Category.find({ pageId: pageID });
    query.sort('id');
    return await query.exec();
}

export const getCategory = async (pageID, categoryID) => {
    const query = Category.findOne({ pageId: pageID, id: categoryID });
    return await query.exec();
}

