import { HttpParams } from "@angular/common/http";

/**
 * Main class for building the query to send odata api. 
 * */
export class QueryData
{   

    /**
     * SelectData to create a projection of a query with direct or expanded/included properties.
     */
    selectData : SelectData | null = null;

    /**
     * OrderByData to create a order by clause of a query.
     */
    orderbyData : OrderByData[] = [];

    /**
     * FilterData to create a filter clause of a query.
     * */
    filterData : (FilterData | AnyFilterData | NegateFilterData)[] = [];

    /**
     * Whether to add skip and top clause to the query for paging. (Default: true)
     * */
    pagination : boolean = true;

    /**
     * Whether to add count clause to the query (Default: value of pagination)
     * */
    showCount : boolean = this.pagination;

    /**
     * Whether to add top clause to the query (Default: 10)
     * 
     * @description
     * top can be used to limit the number of records returned.
     * If pagination is false, then top is ignored.
     * */
    top : number = 10;

    /**
     * Whether to add skip clause to the query (Default: 0)
     * 
     * @description
     * skip can be used to skip the number of records returned. Used in conjunction with top for pagination.
     * If pagination is false, then skip is ignored.
     * */
    skip : number = 0;

    /**
     * URL of the odata api to use with HttpClient.
     * 
     * @example
     * ```typescript
     * const query = new QueryData();
     * ...
     * ...
     * ...
     * query.url = "https://api.odata.com/odata/People";
     * 
     * 
     * HttpClient.get(query.url, {params: query.getHttpParams()})
     * ```
     * */
    url : string = "";


    /**
     * @description
     * 
     * Creates HttpParams from the data given in the QueryData and returns it.
     * 
     * @returns HttpParams 
     * */
    getHttpParams() : HttpParams
    {
        
        let params = new HttpParams();
        if (this.selectData != null)
        {
            if (this.selectData.select)
            {
                if (typeof this.selectData.select == "string"){
                params = params.append("$select", this.selectData.select);
                }
                else{
                    params = params.append("$select", this.selectData.select.join(","));
                }
            }
            
            if (this.selectData.expandData.length > 0)
            {
                for (let index = 0; index < this.selectData.expandData.length; index++) {
                    params = this.selectData.expandData[index].getHttpParams(params);                    
                }
            }
        }

        if (this.filterData.length > 0)
        {
            let filter = [];
            let lastFieldName = null;           

            for (let index = 0; index < this.filterData.length; index++) {
                
                let element = this.filterData[index];
                let currentFieldName = element.field;
                let openParanthesis = false;
                let closeParanthesis = false;

                if (lastFieldName != currentFieldName){
                    openParanthesis = true;
                }

                if (index < this.filterData.length - 1)
                {
                    if (this.filterData[index + 1].field != currentFieldName)
                    {
                        closeParanthesis = true;
                    }                    
                }
                 
                filter.push(FilterDataFunctions.getFilter(element,  openParanthesis, closeParanthesis));

                if (index < this.filterData.length - 1)
                {
                    if (this.filterData[index + 1].logicalOperator != element.logicalOperator)
                    {
                        filter.push(this.filterData[index + 1].logicalOperator);
                    }
                    else 
                    {
                        filter.push(element.logicalOperator);
                    }
                }
                else 
                {
                    if (openParanthesis && !closeParanthesis)
                    {
                        filter.push(")");
                    }
                }

      
                
            }
           
            params = params.append("$filter", filter.join(" "));
        }

        if (this.pagination)
        {
            params = params.append("$top", this.top.toString());
            params = params.append("$skip", this.skip.toString());
        }

        if (this.orderbyData.length > 0)
        {
            params = params.append("$orderby", this.orderbyData.map(x => x.orderby + " " + x.direction).join(","));
        }

        if (this.showCount === true)
        {
            params = params.append("$count", "true");
        }
        


        return params;
    }

  
}


/**
 * Class to create a projection of a query with direct or expanded/included properties.
 * */
export class SelectData
{
    /**
     * Array of strings or comma separated string of properties to select.
     * @example
     * ```typescript
     * const query = new QueryData();
     * query.SelectData = new SelectData("Name,Age");
     * 
     * query.SelectData = new SelectData(["Name", "Age"]);
     * 
     * ```	
     * */
    select : string | string[];

    /**
     * Array of ExpandData to create a projection of a query with expanded/included properties.
     * 
     * @example
     * ```typescript
     * const query = new QueryData();
     * query.SelectData = new SelectData(["Name", "Age"]);
     * query.SelectData.expandData.push(new ExpandData("Address"));
     * ```
     * */
    expandData : ExpandData[] = [];

    /**
     * @description
     *  Creates a SelectData object with the given select property and optional expand data.
     * 
     * @param select string or array of strings of properties to select.
     * @param expandData array of ExpandData to create a projection of a query with expanded/included properties.
     * 
     * * @example
     * ```typescript
     * const query = new QueryData();
     * query.SelectData = new SelectData(["Name", "Age"]);
     * query.SelectData.expandData.push(new ExpandData("Address"));
     * ```
     * */
    constructor(select : string | string[], expand : ExpandData[] = [])
    {
        this.select = select;
        this.expandData = expand;
    }

    /**
     * @description
     * Gets array of strings of properties to select.
     * 
     * @returns string[]
     * */
    getSelectArray() : string[]
    {
        if (typeof this.select == "string")
        {
            return this.select.split(",");
        }
        else 
        {
            return this.select;
        }
    }
}

/**
 * Class to create an orderby clause of a query.
 */
export class OrderByData
{
    /**
     * @description
     * Field to order by.
     */
    orderby : string;

    /**
     * @description
     * Direction of the orderby.
     *  @example
     * ```typescript
     * const query = new QueryData();
     * query.orderbyData.push(new OrderByData("Name", "asc"));
     * ```
     * */
    direction : string = "asc";

    /**
     * @description
     * Creates an OrderByData object with the given field and direction.
     * 
     * @param field string of field to order by.
     * @param direction string of direction to order by (default : asc).
     * 
     * * @example   
     * ```typescript
     * const query = new QueryData();
     * query.orderbyData.push(new OrderByData("Name", "desc"));
     * ```
     * */
    constructor(orderby : string, direction : string = "asc")
    {
        this.orderby = orderby;
        this.direction = direction;
    }
}


/**
 * Class to create an expand/include data of a query.
 */
export class ExpandData
{

    /**
     * @description
     * Field to expand/include.
     * @example
     * ```typescript
     * const query = new QueryData();
     * query.expandData.push(new ExpandData("Address"));
     * ```
     * */
    field : string;

    /**
     * @description
     * SelectData object for the expanded field.
     * 
     * */
    select : SelectData;

    /**
     * @description
     * OrderByData object for the expanded field. 
     * 
     * @remarks
     * If expanded field is a collection, then orderby data will be applied to the collection.
     * */
    orderby : OrderByData[];

    /**
     * @description
     * FilterData object for the expanded field.
     * 
     * @remarks
     * If expanded field is a collection, then filter data will be applied to the collection.
     * */
    filterData : (FilterData | AnyFilterData | NegateFilterData)[] = [];

    /**
     * @description
     * If expanded field is a collection, only one record will be selected from the collection.
     * */
    singleRecord : boolean = false;

    /**
     * 
     * @param field string of field to expand/include.
     * @param select SelectData object for the expanded field.
     * @param orderby OrderByData object for the expanded field.
     * @param single Whether to select only one record from the collection. Default : false.
     */
    constructor(field : string, select : SelectData, orderby : OrderByData[] = [], single : boolean = false)
    {
        this.field = field;
        this.select = select;
        this.orderby = orderby;
        this.singleRecord = single;
    }

    /**
     *  @description
     *  Adds expand/include data to the given HttpParams and returns the HttpParams.
     * 
     * @param params HttpParams object to append the expand/include data to.
     * @returns HttpParams
     */
    getHttpParams(params : HttpParams) : HttpParams
    {
        let query = this.field;

        if (this.select != null)
        {
            query += "(";
            let hasSubQuery = false;
            if (this.select.select)
            {
                if (typeof this.select.select == "string"){
                query += "$select=" + this.select.select;
                }
                else{
                    query += "$select=" + this.select.select.join(",");
                }

                hasSubQuery = true;
            }



            if (this.select.expandData.length > 0)
            {   
                if (hasSubQuery)
                {
                    query += ";";
                }

                for (let index = 0; index < this.select.expandData.length; index++) {
                    query += this.select.expandData[index].getHttpParams(params);                    
                }
            }
            

            if (this.singleRecord)
            {
                if (hasSubQuery)
                {
                    query += ";";
                }

                query += "$top=1";
            }

            if (this.filterData.length > 0)
            {
                if (hasSubQuery)
                {
                    query += ";"
                }

                if (this.filterData.length > 0)
                {
                    let filter = [];
                    let lastFieldName = null;           
        
                    for (let index = 0; index < this.filterData.length; index++) {
                        
                        let element = this.filterData[index];
                        let currentFieldName = element.field;
                        let openParanthesis = false;
                        let closeParanthesis = false;
        
                        if (lastFieldName != currentFieldName){
                            openParanthesis = true;
                        }
        
                        if (index < this.filterData.length - 1)
                        {
                            if (this.filterData[index + 1].field != currentFieldName)
                            {
                                closeParanthesis = true;
                            }                    
                        }
                         
                        filter.push(FilterDataFunctions.getFilter(element,  openParanthesis, closeParanthesis));
        
                        if (index < this.filterData.length - 1)
                        {
                            if (this.filterData[index + 1].logicalOperator != element.logicalOperator)
                            {
                                filter.push(this.filterData[index + 1].logicalOperator);
                            }
                            else 
                            {
                                filter.push(element.logicalOperator);
                            }
                        }
                        else 
                        {
                            if (openParanthesis && !closeParanthesis)
                            {
                                filter.push(")");
                            }
                        }    
                    }

                    query += "$filter=" + filter.join(" ");                   
                }
            }

            if (this.orderby.length > 0)
            {
                if (hasSubQuery)
                {
                    query += ";";
                }

                query += "$orderby=" + this.orderby.map(x => x.orderby + " " + x.direction).join(",");
            }

            query += ")";
        }

        return params.append("$expand", query);
    }
}


/**
 * Class to create a filter data of a query.
 */
export class FilterData
{
    /**
     * @description
     * Field to filter.
     */
    field : string;

    /**
     * @description
     * Method to filter.
     * @example
     * ```typescript
     * const query = new QueryData();
     * query.filterData.push(new FilterData("Name", "eq", "John"));
     * query.filterData.push(new FilterData("Name", MatchMode.Equals, "John"));
     * ```
     * */
    matchMode : string | MatchMode;

    /**
     * @description
     * Logical operator to use after the filter. (and / or)
     * */
    logicalOperator : string;

    /**
     * @description
     * Value to filter.
     * */
    value : any;

    /**
     * @description
     * Used specifically for contains, startsWith and endsWith. Switches field and value positions.
     * 
     * @example
     * ```typescript
     * const query = new QueryData();
     * query.filterData.push(new FilterData("Name", "startsWith", "John")); // Name field starts with John
     * ...
     * query.filterData.push(new FilterData("Name", "contains", "John", MatchDirection.InValue)); // John contains Name field
     * ```  
     * 
     * */
    matchDirection : number | MatchDirection;
   

    /**
     * 
     * @param field string of field to filter.
     * @param matchMode Method to filter. 
     * @param value Value to filter. 
     * @param operator Logical operator to use after the filter. (and / or) 
     * @param matchDirection Used specifically for contains, startsWith and endsWith. Switches field and value positions. Default : MatchDirection.InField.
     * 
     * @example
     * ```typescript
     * const query = new QueryData();
     * query.filterData.push(new FilterData("Name", "eq", "John"));
     * query.filterData.push(new FilterData("Name", MatchMode.Equals, "John"));
     * ```
     */
    constructor(field : string, matchMode : string | MatchMode, value : any, operator : string = "and", matchDirection : MatchDirection = MatchDirection.inField)
    {
        this.field = field;
        this.value = value;
        this.matchMode = matchMode;
        this.logicalOperator = operator;     
        this.matchDirection = matchDirection;
    }
}

/**
 * Class to use any method to filter a query.
 */
export class AnyFilterData
{
    /**
     * @description
     * Field to use with any method.
     * 
     * @remarks
     * Used for collections or directly for the filter.
     * */
    field : string;

    /**
     * @description
     * Filter to use in any method.
     * */
    FilterData : FilterData | AnyFilterData;

    /**
     * @description
     * Logical operator to use after the filter. (and / or)
     * */
    logicalOperator : string;

    /**
     * 
     * @param field string of field to use with any method.
     * @param FilterData Filter to use in any method. 
     * @param operator Logical operator to use after the filter. (and / or)
     * 
     * @example
     * ```typescript
     * const query = new QueryData();
     * query.SelectData = new SelectData("CarName");
     * query.SelectData.expandData.push(new ExpandData("Drivers", "Name, Surname, Age"));     * 
     * query.filterData.push(new AnyFilterData("Drivers", new FilterData("Name", "eq", "John")));
     * query.filterData.push(new AnyFilterData("Drivers", new FilterData("Name", MatchMode.Equals, "John")));
     * ``` 
     */
    constructor(field : string, FilterData : FilterData | AnyFilterData, operator : string = "and")
    {
        this.field = field;
        this.FilterData = FilterData;
        this.logicalOperator = operator;
    }
}

/**
 * Class to negate a filter.
 */
export class NegateFilterData
{
    /**
     * @description
     * Filter to negate.
     * 
     * @remarks
     * any method can be negated too.
     */
    filterData : FilterData | AnyFilterData;
    field? : string; // if field is not null, the filter is a negate filter for a single field // NOT IMPLEMENTED YET
    logicalOperator? : string; // if logicalOperator is not null, the filter is a negate filter for a group of filters 

    /**
     * @description
     * @param filterData Filter to negate.
     * @param field not used yet.
     * @param logicalOperator logical operator to use after the filter. (and / or)
     * 
     * @example
     * ```typescript
     * const query = new QueryData();
     * query.SelectData = new SelectData("CarName");
     * query.SelectData.expandData.push(new ExpandData("Drivers", "Name, Surname, Age"));     *
     * query.filterData.push(new NegateFilterData(new FilterData("Drivers", "contains", "John")));
     * query.filterData.push(new NegateFilterData(new FilterData("Drivers", MatchMode.Contains, "John")));
     * ```
     * */
    constructor(filterData : FilterData | AnyFilterData, logicalOperator? : string, field? : string)
    {
        this.filterData = filterData;
        this.field = field;
        if (logicalOperator){
            this.logicalOperator = logicalOperator;
        }
        else {
            if (filterData instanceof FilterData)
            {
                this.logicalOperator = filterData.logicalOperator;
            }
        }
        
    }
}

/**
 * Internal class to use to create a filter
 */
 class FilterDataFunctions
 {
    
    /**
     * @description
     * Generates a filter string for the field and value.
     * */
     static getFilter(element: FilterData | AnyFilterData | NegateFilterData,  openParanthesis: boolean, closeParanthesis: boolean) : string {
         if (element instanceof FilterData) {
             return this.getFilterData(element as FilterData, openParanthesis, closeParanthesis);
         }
         else if (element instanceof AnyFilterData) {
             return this.getAnyFilterData(element as AnyFilterData, openParanthesis, closeParanthesis, 0);
         }
         else // negate filter
         {        
             return "not " + this.getFilter((element as NegateFilterData).filterData, openParanthesis, closeParanthesis);
 
         }
     }
 
     /**
      * 
      * @description
      * Gets raw filter string from a filter data whether it is function filter or not.
      * 
      * @param element FilterData to use.
      * @param openParenthesis boolean to open or not the parenthesis.
      * @param closeParenthesis boolean to close or not the parenthesis.
      * @returns string of the filter.
      */
     static getFilterData(element : FilterData, openParenthesis : boolean, closeParenthesis : boolean) : string
     {         
         
         if (element.matchMode == MatchMode.startsWith || element.matchMode == MatchMode.endsWith || element.matchMode == MatchMode.contains)
         {                   
 
             return this.getFunctionFilter(element,openParenthesis,closeParenthesis);
         }
         else 
         {               
             return this.getOperatorFilter(element,openParenthesis,closeParenthesis);
         }
     } 
 
     
    /**
     * @description
     * Gets raw filter string from a filter data that uses a function such as contains, startsWith, endsWith.
     * */
     static getFunctionFilter(element : FilterData,openParenthesis : boolean,closeParenthesis : boolean){
 
         let beginParenthesis = openParenthesis ? "(" : "";
         let endParenthesis = closeParenthesis ? ")" : "";

         let mm = element.matchMode;
         let index = Object.keys(MatchMode).indexOf(mm.toString());
         let matchMode = Object.values(MatchMode)[index];
         
         if (element.matchDirection == MatchDirection.inField){
             return beginParenthesis + matchMode + "(" + element.field + ", " + this.getValue(element) + ")" + endParenthesis;
         }
         else {
             return beginParenthesis + matchMode + "(" + this.getValue(element) + ", " + element.field + ")" + endParenthesis;
         }
     }
 

    /**
     * @description
     * Gets raw filter string from a filter data that uses an operator such as eq, ne, gt, lt, ge, le.
     * */
     static getOperatorFilter(element : FilterData,openParenthesis : boolean,closeParenthesis : boolean) : string{
 
         let beginParenthesis = openParenthesis ? "(" : "";
         let endParenthesis = closeParenthesis ? ")" : "";

         let mm = element.matchMode;
         let index = Object.keys(MatchMode).indexOf(mm.toString());
         let matchMode = Object.values(MatchMode)[index];
 
         if (element.matchDirection == MatchDirection.inField){
             return beginParenthesis + element.field + " " + matchMode + " " + this.getValue(element) + endParenthesis;
         }
         else {
             return beginParenthesis + this.getValue(element) + " " + matchMode + " " + element.field + endParenthesis;
            
         }
     }
 
     /**
      * 
      * @description
      * Gets raw filter string from a filter data that uses "any" method 
      * 
      * @param element AnyFilterData to use.
      * @param openParenthesis boolean to open or not the parenthesis.
      * @param closeParenthesis boolean to close or not the parenthesis.
      * @param depth depth of the filter.
      * @returns string of the filter.
      */
     static getAnyFilterData(element : AnyFilterData,openParenthesis : boolean,closeParenthesis : boolean, depth : number) : string {
 
         let anyVariables = "abcdefghijklmnopqrstuvwxyz";
         let beginParenthesis = openParenthesis ? "(" : "";
         let endParenthesis = closeParenthesis ? ")" : "";
     
         if (element.FilterData instanceof FilterData){
             return beginParenthesis + element.field + "/any(a : a/" + this.getFilterData(element.FilterData as FilterData,false,false) + ")" + endParenthesis
                        
         }
         else {
             var variable = anyVariables[depth]
 
             return beginParenthesis + element.field + "/any(" + variable + " : " + anyVariables[depth] + "/" + this.getAnyFilterData(element.FilterData as AnyFilterData,false,false,depth + 1) + ")" + endParenthesis; 
           
         }
 
 
     }    
 
     /**
      * @description
      * gets raw string of the value from a filter data according to the type of the value.
      * 
      * @param element FilterData to use.
      * @returns string of the filter.
      */
     static getValue(element: FilterData) {
         if (typeof element.value == "string") {
             return "'" + element.value + "'";
         }
         else if (typeof element.value == "number") {
             return element.value.toString();
         }
 
         else if (Object.prototype.toString.call(element.value) === "[object Date]" && !isNaN(element.value))
         {
             return element.value.toISOString();            
         }
         else {
             return "'" + element.value + "'";            
         }
     }
 }
 
/**
 * @description
 * MatchMode enum to use to specify the match mode of the filter.
 */
export enum MatchMode
{
    equals = "eq",
    notEquals = "ne",
    greaterThan = "gt",
    greaterThanOrEqual = "ge",
    lessThan = "lt",
    lessThanOrEqual = "le",
    contains = "contains", 
    startsWith = "startsWith",
    endsWith = "endsWith"
}

/**
 * @description
 * MatchDirection enum to use to specify the match direction of the filter.
 * 
 */
export enum MatchDirection 
{
    inField = 1,
    inValue = 2,
}