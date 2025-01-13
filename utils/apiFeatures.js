const mongoose = require("mongoose");
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

  async search() {
    if (this.queryString.keyword) {
      if(Object.entries(this.queryString.keyword)[0][0]==='0'){
        let query={};
        if(this.queryString.keyword.includes(",")){
          query = {$and:[{ name: { $regex: this.queryString.keyword.split(",")[0], $options: 'i' } },
            { specialization: { $regex: this.queryString.keyword.split(",")[1], $options: 'i' } }]}
        }
        else {

           query = {$or:[{ name: { $regex: this.queryString.keyword, $options: 'i' } },
          { specialization: { $regex: this.queryString.keyword, $options: 'i' } },
          { question: { $regex: this.queryString.keyword, $options: 'i' } },
        ]}
        }
        this.mongooseQuery = this.mongooseQuery.find(query); 
      }
      else{

      const serachFidelds = Object.entries(this.queryString.keyword)[0]; // Get the first key-value pair

      const [path, name] = serachFidelds;
      const buildPopulateOption = (pathParts) => {
        if (pathParts.length === 0) return null;
        
        const [currentPath, ...remainingPaths] = pathParts;
     
        let populateOption;
        remainingPaths.length===0?
         populateOption = {
          path:currentPath,
          select: "-password",
          match: { name : {$regex: name, $options: "i" }},


        }:populateOption = {
            path:currentPath,
            select: "-password",

          }
        
          
        const nestedPopulate = buildPopulateOption(remainingPaths);
        if (nestedPopulate) populateOption.populate = nestedPopulate;

        return populateOption;
      };

   
      const pathParts = path.split(".");
      const populateOption = buildPopulateOption(pathParts);

      if (populateOption) {
        this.mongooseQuery = this.mongooseQuery.populate(populateOption);
        // console.log(await this.mongooseQuery.clone().populate(populateOption))
      }
      const results = await this.mongooseQuery.clone();
       const filteredResults = results.filter(doc => doc[path] !== null); 
      // Reassign this.mongooseQuery with the filtered results
       const filteredIds = filteredResults.map(doc => doc._id);
        this.mongooseQuery = this.mongooseQuery.find({ _id: { $in: filteredIds } }); 
        this.countDocuments = await this.mongooseQuery.clone().countDocuments(); return this;
      // this.mongooseQuery=this.mongooseQuery.find()
    }
  }
  this.countDocuments = await this.mongooseQuery.clone().countDocuments();
  
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
  async groupBy(id,role) {
    if (this.queryString.groupBy) {
      const groupByFields = Object.entries(this.queryString.groupBy)[0]; // Get the first key-value pair
      const [granularityOrField, fields] = groupByFields;
      const regex = /\b\w*cost\w*\b/i;
  
      // Ensure `fields` is an array (split it if it's a string)
      let fieldsArray = typeof fields === 'string' ? fields.split(',') : fields;
      const CostSum = fieldsArray.find(field => (regex.test(field) ? field : null));
      fieldsArray = fieldsArray.filter(word => !regex.test(word));
  
      if (!fieldsArray || fieldsArray.length === 0) {
        throw new Error("At least one field is required for grouping.");
      }
  
      // Validate input
      const validDateGranularities = ["year", "month", "day"];
      const validFields = ["date", "createdAt", "updatedAt"];
  
      // Check if it's date-based grouping
      const isDateGrouping = validDateGranularities.includes(granularityOrField);
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
  
      // Add filtering by userId if it exists
      const matchStage = role!=='admin'&&id ?  { $match: {[role]: new mongoose.Types.ObjectId(id) } }: { $match: {} };
      // Build the aggregation pipeline
      const pipeline = [
       matchStage,
        {
          $group: {
            _id: groupId,
            count: { $sum: 1 },
            totalCost: { $sum: CostSum !== undefined ? `$${CostSum}` : "" }, // Accumulate the total cost
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
