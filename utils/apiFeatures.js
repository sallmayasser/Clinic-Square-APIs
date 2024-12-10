  class ApiFeatures {
    constructor(mongooseQuery, queryString) {
      this.mongooseQuery = mongooseQuery;
      this.queryString = queryString;
      this.countDocuments=0;
    }

    async filter() {
      const queryStringObj = { ...this.queryString };
      const excludesFields = [
        "page",
        "sort",
        "limit",
        "fields",
        "keyword",
        "populate",
        "groupBy"
      ];
      excludesFields.forEach((field) => delete queryStringObj[field]);
    
      let queryStr = JSON.stringify(queryStringObj);
    
      queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne|or|and)\b/g, (match) => `$${match}`);
    
    
      this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryStr));
      this.countDocuments = await this.mongooseQuery.clone().countDocuments();
      return  this;
    }
    async sort() {
      if (this.queryString.sort) {
        const sortBy = this.queryString.sort.split(",").join(" ");
        this.mongooseQuery = this.mongooseQuery.sort(sortBy);
      } else {
        this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
      }
      return this;
    }

    async limitFields() {
      if (this.queryString.fields) {
        const fields = this.queryString.fields.split(",").join(" ");
        this.mongooseQuery = this.mongooseQuery.select(fields);
      } else {
        this.mongooseQuery = this.mongooseQuery.select("-__v");
      }
      return this;
    }

    async search(searchFields = [], populateFields = []) {
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

    async paginate() {
      const page = this.queryString.page * 1 || 1;
      const limit = this.queryString.limit * 1 || 50;
      const skip = (page - 1) * limit;
      const endIndex = page * limit;

      // Pagination results
      const pagination = {};
      pagination.currentPage = page;
      pagination.limit = limit;
      pagination.numberOfPages = Math.ceil(this.countDocuments / limit);

      // Next page
      if (endIndex < this.countDocuments) {
        pagination.next = page + 1;
      }

      if (skip > 0) {
        pagination.prev = page - 1;
      }

      this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);
      this.paginationResult = pagination;

      return this;
    }

    async populate() {
      if (this.queryString.populate) {
        const substringToRemove = "password";
        const fieldsToPopulate = this.queryString.populate.split(",");
        console.log(fieldsToPopulate)
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
    async groupBy() {
      if (this.queryString.groupBy) {
        const groupByFields = Object.entries(this.queryString.groupBy)[0]; // Get the first key-value pair
        const [granularityOrField, fields] = groupByFields;
    
        // Ensure `fields` is an array (split it if it's a string)
        const fieldsArray = typeof fields === 'string' ? fields.split(',') : fields;
    
        if (!fieldsArray || fieldsArray.length === 0) {
          throw new Error("At least one field is required for grouping.");
        }
    
        // Validate input
        const validDateGranularities = ["year", "month", "day"];
        const validFields = ["date", "createdAt", "updatedAt"];
    
        // Check if it's date-based grouping
        const isDateGrouping = validDateGranularities.includes(granularityOrField) && fieldsArray.some(field => validFields.includes(field));
    
        // Construct the groupId dynamically
        const groupId = {};
        const sort = {};
    
        // Handle Date-Based Grouping (for fields like 'date', 'createdAt')
        if (isDateGrouping) {
          const dateFields = fieldsArray.filter(field => validFields.includes(field));
    
          // Only perform $toDate once per field
          dateFields.forEach(dateField => {
            const formattedDateField = `$${dateField}`;
    
            // Group by the desired granularity (year, month, day)
            if (granularityOrField === "year" || granularityOrField === "month" || granularityOrField === "day") {
              groupId.year = { $dateToString: { format: "%Y", date: { $toDate: formattedDateField } } };
            }
            if (granularityOrField === "month" || granularityOrField === "day") {
              groupId.month = { $dateToString: { format: "%m", date: { $toDate: formattedDateField } } };
            }
            if (granularityOrField === "day") {
              groupId.day = { $dateToString: { format: "%d", date: { $toDate: formattedDateField } } };
            }
          });
    
          // Sorting by grouped date fields
          sort["_id.year"] = 1;
          if (granularityOrField !== "year") sort["_id.month"] = 1;
          if (granularityOrField === "day") sort["_id.day"] = 1;
        }
    
        // Handle Non-Date Fields (e.g., 'doctor', 'patient')
        const nonDateFields = fieldsArray.filter(field => !validFields.includes(field));
        nonDateFields.forEach(field => {
          groupId[field] = `$${field}`;
          sort[`_id.${field}`] = 1;
        });
    
        // Build the aggregation pipeline
        const pipeline = [
          {
            $group: {
              _id: groupId,
              count: { $sum: 1 },
            },
          },
          {
            $sort: sort,
          },
        ];
    
        // Execute the aggregation
        const aggregatedData = await this.mongooseQuery.model.aggregate(pipeline);
    
        // Store the result
        this.mongooseQuery = aggregatedData;
        return this;
      }
    }
    
    



  }

  
  module.exports = ApiFeatures;
