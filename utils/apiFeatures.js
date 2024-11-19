class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
  }

  filter() {
    const queryStringObj = { ...this.queryString };
    const excludesFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "keyword",
      "populate",
    ];
    excludesFields.forEach((field) => delete queryStringObj[field]);

    // Apply filteration using [gte,gt,lte,lt]
    let queryStr = JSON.stringify(queryStringObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|ne)\b/g,
      (match) => `$${match}`
    );

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }
    return this;
  }
  search(searchFields = [], populateFields = []) {
    if (this.queryString.keyword) {
      const keywordRegex = { $regex: this.queryString.keyword, $options: "i" };
      const query = {};

      // Add search criteria for main fields
      if (searchFields.length > 0) {
        query.$or = searchFields.map((field) => ({ [field]: keywordRegex }));
      }

      // Add search criteria for populated fields
      if (populateFields.length > 0) {
        populateFields.forEach((populateField) => {
          query[`${populateField}.name`] = keywordRegex;
          this.mongooseQuery = this.mongooseQuery.populate({
            path: populateField,
            match: { name: keywordRegex },
          });
        });
      }

      this.mongooseQuery = this.mongooseQuery.find(query);
    }
    return this;
  }

  paginate(countDocuments) {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const skip = (page - 1) * limit;
    const endIndex = page * limit;

    // Pagination results
    const pagination = {};
    pagination.currentPage = page;
    pagination.limit = limit;
    pagination.numberOfPages = Math.ceil(countDocuments / limit);

    // Next page
    if (endIndex < countDocuments) {
      pagination.next = page + 1;
    }

    if (skip > 0) {
      pagination.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
    this.paginationResult = pagination;

    return this;
  }

  populate() {
    if (this.queryString.populate) {
      const substringToRemove = "password";
      const fieldsToPopulate = this.queryString.populate.split(",");

      // Recursive function to build nested populate options
      const buildPopulateOption = (pathParts) => {
        if (pathParts.length === 0) return null;

        const [currentPath, ...remainingPaths] = pathParts;
        const selectFields = currentPath.includes("=")
          ? currentPath.split("=")[1].replace(substringToRemove, "")
          : "-password";

        const path = currentPath.includes("=")
          ? currentPath.split("=")[0]
          : currentPath;

        // Recursively build nested populate for remaining paths
        const populateOption = {
          path,
          select: selectFields,
        };

        const nestedPopulate = buildPopulateOption(remainingPaths);
        if (nestedPopulate) populateOption.populate = nestedPopulate;

        return populateOption;
      };

      fieldsToPopulate.forEach((field) => {
        const pathParts = field.split(".");
        const populateOption = buildPopulateOption(pathParts);

        if (populateOption) {
          this.mongooseQuery = this.mongooseQuery.populate(populateOption);
        }
      });
    }
    return this;
  }
}

module.exports = ApiFeatures;
