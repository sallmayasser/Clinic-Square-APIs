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
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne)\b/g, (match) => `$${match}`);

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

  search(modelName) {
    if (this.queryString.keyword) {
      let query = {};
      if (modelName === "Lab" || modelName === "TestService") {
        query = { name: { $regex: this.queryString.keyword, $options: "i" } };
      } else {
        query.$or = [
          { firstName: { $regex: this.queryString.keyword, $options: "i" } },
          { lastName: { $regex: this.queryString.keyword, $options: "i" } },
        ];
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
      // console.log(this.queryString.populate)
      const fieldsToPopulate = this.queryString.populate
        .split(",")
        .map((field) => {
          if (field.includes("=")) {
            let [path, subfields] = field.split("=");
            subfields = subfields.replace(substringToRemove, "");
            subfields = subfields ? `${subfields} ` : "-password";
            return { path, select: subfields };
          }
          return { path: field, select: "-password" };
          
        });

      fieldsToPopulate.forEach((populateOption) => {
        this.mongooseQuery = this.mongooseQuery.populate(populateOption);
      });
    }
    return this;
  }
  // New populate method
  // populate() {
  //   if (this.queryString.populate) {
  //     const fieldsToPopulate = this.queryString.populate
  //       .split(",")
  //       .map((field) => {
  //         if (field.includes(".")) {
  //           let [path, subfields] = field.split(".");

  //           if (
  //             path === "patient" ||
  //             path === "doctor" ||
  //             path === "lab" ||
  //             path === "pharmacy"
  //           ) {
  //             const substringToRemove = "password";
  //             subfields = subfields.replace(substringToRemove, "");
  //             subfields = subfields ? `${subfields} ` : "-password";
  //           }
  //           return { path, select: subfields };
  //         }

  //         if (
  //           field === "patient" ||
  //           field === "doctor" ||
  //           field === "lab" ||
  //           field === "pharmacy"
  //         ) {
  //           return { path: field, select: "-password" };
  //         }
  //         return { path: field };
  //       });

  //     fieldsToPopulate.forEach((populateOption) => {
  //       this.mongooseQuery = this.mongooseQuery.populate(populateOption);
  //     });
  //   }
  //   return this;
  // }
}

module.exports = ApiFeatures;
