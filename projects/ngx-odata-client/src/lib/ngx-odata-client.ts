//
import { HttpParams } from "@angular/common/http";

/**
 * Main class for building the query to send odata api. 
 * */
 export class QueryData
 {  
    static setPagination : boolean = false;
    static setTop : number | undefined;
    static setSkip : number | undefined;
    static setShowCount : boolean | undefined;

     /**
      * SelectData to create a projection of a query with direct or expanded/included properties.
      */
     selectData : SelectData | null = null;


     
 
     /**
      * OrderByData to create a order by clause of a query.
      */
     orderbyData : OrderByData[] = [];


     select : string | string[] | null = null; 
     filter : Filter;
     orderBy : OrderBy;
     expand : ExpandFactory;

     constructor()
     {
        this.filter = new Filter();
        this.orderBy = new OrderBy();
        this.expand = new ExpandFactory();

        if (QueryData.setPagination)
        {
            this.pagination = true;
            this.showCount = true;
        }

        if (QueryData.setTop != undefined)
        {
            this.top = QueryData.setTop;
        }

        if (QueryData.setSkip != undefined)
        {
            this.skip = QueryData.setSkip;
        }
     }



     addTop(top : number) : QueryData
     {
        this.top = top;
        return this;
     }

     addSkip(skip : number) : QueryData
     {
        this.skip = skip;
        return this;
     }

     addPagination(top : number, skip : number, showCount : boolean) : void{
        this.pagination = true;
        this.top = top;
        this.skip = skip;
        this.showCount = showCount;
     }

     addCount(showDataCount : boolean) : QueryData
     {
        this.showCount = showDataCount;
        return this;
     }

 
    //  expand(field : string) : Expand{
    //     return new Expand(field);
    //  }
     /**
      * FilterData to create a filter clause of a query.
      * */
     filterData : (FilterData | AnyFilterData | NegateFilterData)[] = [];
 
     /**
      * Whether to add skip and top clause to the query for paging. (Default: true)
      * */
     pagination : boolean = false;
 
     /**
      * Whether to add count clause to the query (Default: value of pagination)
      * */
     showCount : boolean = false;
 
     /**
      * Whether to add top clause to the query (Default: 10)
      * 
      * @description
      * top can be used to limit the number of records returned.
      * If pagination is false, then top is ignored.
      * */
     top : number | undefined;
 
     /**
      * Whether to add skip clause to the query (Default: 0)
      * 
      * @description
      * skip can be used to skip the number of records returned. Used in conjunction with top for pagination.
      * If pagination is false, then skip is ignored.
      * */
     skip : number | undefined;
 
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
 
     getHttpParams() : HttpParams
     {
        let params = new HttpParams();

        this.getQueryStrings(this.select,this.expand,this.filter,this.orderBy,this.top,this.skip,this.showCount).forEach((v,k) => {
            params = params.append(k, v);
        });
        


        return params;
     }


     private getQueryStrings(select : string | string[] | null,expand: ExpandFactory,filter : Filter,orderBy : OrderBy,top : number | undefined,skip : number | undefined,showCount : boolean) : Map<string,string>
     {
        let queryStrings = new Map<string,string>();

        if (select && select.length > 0)
        {
            if (select instanceof Array)
            {
                queryStrings.set("$select", select.join(","));               
            }
            else if (typeof this.select === "string")
            {
                queryStrings.set("$select", select);
            }
            else 
            {
                throw new Error("select must be a comma separated string or array of strings");
            }
        }

        if (expand)
        {
            let expandList = expand.expandList;

            if (expandList.length > 0)
            {
                let expandQuery = "";
                for (let i = 0; i < expandList.length; i++) {
                    const element = expandList[i];



                    if (i == 0)
                    {
                        expandQuery += element.field;                        
                    }
                    else 
                    {
                        expandQuery += "," + element.field;
                    }

                    let factory = new ExpandFactory();
                    if (element.childExpands.length > 0)
                    {
                        for (let child = 0; child < element.childExpands.length; child++) {
                            const childElement = element.childExpands[child];
                            
                            factory.addWithExpand(childElement);
                        }
                    }

                    let expandQueryString = this.getQueryStrings(element.expandSelect,factory,element.filter,element.orderBy,undefined,undefined,false);
                    
                    if (expandQueryString.size > 0)
                    {
                        expandQuery += "(";

                        expandQueryString.forEach((v,k) => {
                            expandQuery += k + "=" + v + ";";
                        })

                        expandQuery = expandQuery.substring(0,expandQuery.length - 1);

                        expandQuery += ")";
                    }


                }

                queryStrings.set("$expand", expandQuery);
            }
        }

        

        if (filter)
        {
            let expressions = filter.expressionList;

            if (expressions && expressions.length > 0)
            {
                let query = "";

                for (let i = 0; i < expressions.length; i++)
                {
                    let expr = expressions[i];

                    if (expr instanceof Expression)
                    {
                        let isFunctionMode = false;

                        if (expr.matchMode === MatchMode.contains || expr.matchMode === MatchMode.endsWith || expr.matchMode === MatchMode.startsWith)
                        {
                            isFunctionMode = true;
                        }

                        if (expr.direction === MatchDirection.inField)
                        {                     
                            if (isFunctionMode)
                            {
                                query += expr.matchMode + "(" + expr.field + "," + this.getValue(expr.value) + ")" + expr.logicalOperator;
                            }   
                            else 
                            {
                                query += expr.field + " " + expr.matchMode + " " + this.getValue(expr.value) + expr.logicalOperator;
                            }    
                           
                        }
                        else 
                        {
                            if (isFunctionMode)
                            {
                                query += expr.matchMode + "(" + this.getValue(expr.value) + "," + expr.field + ")" + expr.logicalOperator;
                            }
                            else 
                            {
                                query += this.getValue(expr.value) + " " + expr.matchMode + " " + expr.field + expr.logicalOperator;
                            }
                            
                        }
                    }
                    else if (typeof expr === "string")
                    {
                        query += expr;
                    }
                }

                queryStrings.set("$filter", query);
            }
        }


        if (orderBy)
        {
            let order = orderBy.orderByList;

            if (order && order.length > 0)
            {
                let query = "";

                for (let i = 0; i < order.length; i++)
                {
                    query += order[i];
                }
               
                queryStrings.set("$orderby", query);
            }
        }

        if (top != undefined)
        {
            queryStrings.set("$top", top.toString());
        }


        if (skip != undefined)
        {
            queryStrings.set("$skip", skip.toString());
        }

        // if (pagination && (this.top || this.skip))
        // {
        //     queryStrings.set("$top", this.top.toString());
        //     queryStrings.set("$skip", this.skip.toString());           
        // }

        // if (this.orderbyData.length > 0)
        // {
           
        //     params = params.append("$orderby", this.orderbyData.map(x => x.orderby + " " + x.direction).join(","));
        // }

        if (showCount === true)
        {
            queryStrings.set("$count", "true");            
        }

        return queryStrings;
     }

     /**
     * @description
     * gets raw string of the value from a filter data according to the type of the value.
     * 
     * @param value FilterData to use.
     * @returns string of the filter.
     */
     private getValue(value: any) {
        if (typeof value == "string") {
            return "'" + value + "'";
        }
        else if (typeof value == "number") {
            return value.toString();
        }
        else if (typeof value == "boolean") {
          return value;
        }  
        else if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value))
        {
            return value.toISOString();            
        }
        else {
            return "'" + value + "'";            
        }
    }
 
     /**
      * @description
      * 
      * Creates HttpParams from the data given in the QueryData and returns it.
      * 
      * @returns HttpParams 
      * */
     getHttpParamsOld() : HttpParams
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
                     params = params.append("$expand",this.selectData.expandData[index].getDeepExpandString());                    
                 }
             }
         }
 
         if (this.filterData.length > 0)
         { 
             let filter = [];
             let lastFieldName = null;           
             let paranthesisCount = 0;
 
             for (let index = 0; index < this.filterData.length; index++) {
                 
                 let element = this.filterData[index];
                 let currentFieldName = element.field;
                 let openParanthesis = false;
                 let closeParanthesis = false;
 
                 if (lastFieldName != currentFieldName){
                     openParanthesis = true;
                     paranthesisCount++;
                     lastFieldName = currentFieldName;
                 }
 
                 if (index < this.filterData.length - 1)
                 {
                     if (this.filterData[index + 1].field != currentFieldName)
                     {
                         closeParanthesis = true;
                         paranthesisCount--;
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
                     if (paranthesisCount > 0 || (openParanthesis && !closeParanthesis))
                     {
                         filter.push(")");
                     }
                 }
 
       
                 
             }
            
             params = params.append("$filter", filter.join(" "));
         }
 
         if (this.pagination && this.top && this.skip)
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

//  export interface IFilter
//  {
//     Expr(field : string, matchMode : string | MatchMode, value : any, direction? : MatchDirection) : IOperator
//     ExprNot(field : string, matchMode : string | MatchMode, value : any, direction? : MatchDirection) : IOperator
//     AddExpression(field : string, matchMode : string | MatchMode, value : any, direction? : MatchDirection) : IOperator
//     AddNotExpression(field : string, matchMode : string | MatchMode, value : any, direction? : MatchDirection) : IOperator
//     Not() : IFilter
//     Any(field : string,variable : string) : IFilter
//     Parenthesis(open : boolean) : IFilter
//     BeginParenthesis() : IFilter
//     EndParenthesis() : IFilter
//     begin(custom : string) : IFilter 
//     end(custom : string) : IFilter
//  }
 

 export class Filter 
 {
     expressionList : (string | Expression)[] = [];
     parenthesisCount : number = 0;
     customStringCount : number = 0;
     functionCounts : number = 0;
     parentExpand? : Expand = undefined;
    
     usedVariables : { type : string, variable : string }[] = [];
     
     variableStrings : string[] = ["x", "y", "z" , "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w"];
     
     
     Expr(field : string, matchMode : string | MatchMode, value : any, direction : MatchDirection = MatchDirection.inField) : Operator
     {
        return this.AddExpression(field, matchMode, value, direction);
     } 
    
     AddExpression(field : string, matchMode : string | MatchMode, value : any, direction : MatchDirection = MatchDirection.inField) : Operator
     {
        let usedVariable = { type : "", variable : "" };
        
        if (this.usedVariables.length > 0){
            usedVariable = this.usedVariables[this.usedVariables.length - 1];
            if (usedVariable.type == "count"){
                this.expressionList.push(usedVariable.variable);
                usedVariable.variable = "";
            }
        }

        this.expressionList.push(new Expression(usedVariable.variable + field, matchMode, value, direction));

        
       

        return new Operator(this);        
     }

     AddNotExpression(field : string, matchMode : string | MatchMode, value : any, direction : MatchDirection = MatchDirection.inField) : Operator
     {
        let usedVariable = { type : "", variable : "" };
        
        if (this.usedVariables.length > 0){
            usedVariable = this.usedVariables[this.usedVariables.length - 1];      
            
            if (usedVariable.type == "count"){
                this.expressionList.push(usedVariable.variable);
                usedVariable.variable = "";
            }
        }
        
        this.expressionList.push("Not ");
        this.expressionList.push(new Expression(usedVariable +  field, matchMode, value, direction));

        

        return new Operator(this);
     }

     Not() : Filter
     {
        this.expressionList.push("Not ");
        return this;
     }


     Any(field : string) : Filter
     {
        var variable = this.variableStrings[this.functionCounts];
        this.functionCounts++;
    
        this.expressionList.push(field + "/any" + "(" + variable + ":");
        
        this.usedVariables.push({ type: 'any', variable: variable + "/"});
        return this;
       // return new AnyFilter(this, field, variable);
     }    

     All(field : string) : Filter
     {
        var variable = this.variableStrings[this.functionCounts];
        this.functionCounts++;
    
        this.expressionList.push(field + "/all" + "(" + variable + ":");
        
        this.usedVariables.push({ type: 'all', variable: variable + "/"});
        return this;
       
     }   


     Count(field : string) : Filter
     {
        this.functionCounts++;

        this.expressionList.push(field + "/count(");
        this.usedVariables.push({ type: 'count', variable: "$filter="});
        return this;

     }

     BeginParenthesis() : Filter
     {
        this.expressionList.push("(");
        this.parenthesisCount++;
        return this;
     }

     EndParenthesis() : Filter
     {
        this.expressionList.push(")");
        this.parenthesisCount--;
        return this;
     }
 }

 export class Operator 
 {
    private filter : Filter;
    constructor(filter : Filter)
    {
        this.filter = filter;
    }

    And() : Filter    
    {
        const expression = this.filter.expressionList[this.filter.expressionList.length - 1];

        if (expression instanceof Expression)
        {
            expression.logicalOperator = " and ";
        }  
        else 
        {
            this.filter.expressionList.push(" and ");
        }

        return this.filter;
    }

    Or() : Filter
    {
        const expression = this.filter.expressionList[this.filter.expressionList.length - 1];

        if (expression instanceof Expression)
        {
            expression.logicalOperator = " or ";
        } 
        else 
        {
            this.filter.expressionList.push(" or ");
        }    
        
        return this.filter;
    }

    EndParenthesis() : Operator
    {
        this.filter.EndParenthesis();
        return this;
    }

    EndAny() : Operator
    {
        let lastAny = this.filter.usedVariables.pop();

        if (lastAny == undefined)
        {
            throw new Error("Not any() found");
        }
        else if (lastAny.type != "any")
        {
            throw new Error("currently not in an any() function, end other functions first.");
        }
        else 
        {
            this.filter.expressionList.push(")");
            return this;
        }
    }
    
    EndAll() : Operator
    {
        let lastAll = this.filter.usedVariables.pop();

        if (lastAll == undefined)
        {
            throw new Error("No all() found");
        }
        else if (lastAll.type != "all")
        {
            throw new Error("current noot in an all() function, end other functions first.");
        }
        else 
        {
            this.filter.expressionList.push(")");
            return this;
        }
        
    }

    EndCount(matchMode : MatchMode, value : any) : Operator
    {
        let lastCount = this.filter.usedVariables.pop();

        if (lastCount == undefined)
        {
            throw new Error("No count() found");
        }
        else if (lastCount.type != "count")
        {
            throw new Error("current not in a count() function, end other functions first.");
        }
        else 
        {
            this.filter.expressionList.push(")");
            this.filter.expressionList.push(new Expression("", matchMode, value, MatchDirection.inField));
         
            return this;
        }
    }

    EndExpandFilter() : Expand
    {
        if (this.filter.parentExpand === undefined)
        {
            throw new Error("not in an expand(), use with expand() first.");
        }
        else 
        {
            return this.filter.parentExpand;
        }

        
    }
 }

 export class OrderBy 
 {
    orderByList : string[];
    lastOrder = "";

    constructor()
    {
        this.orderByList = [];
    }

    Asc(field : string) : OrderBy
    {
        if (this.orderByList.length > 0){
            this.orderByList.push(",");
        }

        this.orderByList.push(field + " asc");

        return this;
    }    

    Desc(field : string) : OrderBy
    {
        if (this.orderByList.length > 0){
            this.orderByList.push(",");
        }

        this.orderByList.push(field + " desc");
        return this;
    }
 }

 export class ExpandOrderBy extends OrderBy
 {
    expand : Expand;
    constructor(expand : Expand)
    {
        super();
        this.expand = expand;

    }
    
    EndExpandOrderBy() : Expand
    {
        return this.expand;
    }
 }

 export class ExpandFactory
 {
    expandList : Expand[] = [];
    add(field : string) : Expand
    {
        let expand = new Expand(field);
        this.expandList.push(expand);
        return expand;
    }


    addWithExpand(expand : Expand) : void
    {
        this.expandList.push(expand);
    }

    
 }

 export class Expand 
 {   
    field : string;
    expandSelect : string[];
    filter : Filter;
    orderBy : ExpandOrderBy;
    childExpands : Expand[];
    parentExpand : Expand | undefined;
    constructor(field : string){
        this.field = field;
        this.expandSelect = [];     
        this.filter = new Filter(); 
        this.filter.parentExpand = this;
        this.childExpands = [];
        this.orderBy = new ExpandOrderBy(this);
    }

    select(field : string | string[]) : Expand
    {
        if (typeof field == "string")
        {
            let f = [field];
            this.expandSelect.push(...f)
        }
        else 
        {
            this.expandSelect.push(...field)
        }

        return this;        
    }

    beginFilter() : Filter
    {        
        return this.filter;
    }

    beginOrderBy() : ExpandOrderBy
    {
        return this.orderBy;
    }

    expand(field : string) : Expand
    {
        let s = new Expand(field);
        s.parentExpand = this;
        this.childExpands.push(s);

        return s;
    }
 }

//  export class AnyOperator //implements IOperator
//  {
//     private anyFilter : AnyFilter;
//     constructor(filter : AnyFilter)
//     {
//         this.anyFilter = filter;
//     }

//     And() : AnyFilter    
//     {
//         const expression = this.anyFilter.filter.expressionList[this.anyFilter.filter.expressionList.length - 1];

//         if (expression instanceof Expression)
//         {
//             expression.logicalOperator = " and ";
//         }  

//         return this.anyFilter;
//     }

//     Or() : AnyFilter
//     {
//         const expression = this.anyFilter.filter.expressionList[this.anyFilter.filter.expressionList.length - 1];

//         if (expression instanceof Expression)
//         {
//             expression.logicalOperator = " or ";
//         }     
        
//         return this.anyFilter;
//     }

//     EndParenthesis() : AnyOperator
//     {
//         this.anyFilter.EndParenthesis();
//         return new AnyOperator(this.anyFilter);
//     }

//     EndAny() : Operator
//     {
//         return new Operator(this.anyFilter.filter);
//     }

//     EndInnerAny() : AnyOperator
//     {
//         return new AnyOperator(this.anyFilter.parent);
//     }
//  }



 class Expression
 {     
     
     field : string;
     matchMode : string | MatchMode;
     value : any;
     logicalOperator : string = "";
     direction : MatchDirection;

     constructor(field : string, operator : string | MatchMode, value : any, direction : MatchDirection)
     {
        this.field = field;
        this.matchMode = operator;
        this.value = value;
        this.direction = direction;
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
                     query += this.select.expandData[index].getDeepExpandString();                  
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
 
     getDeepExpandString() : string
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

                 query += "$expand=";
                 
                 let comma = "";
                 for (let index = 0; index < this.select.expandData.length; index++) {
                    if (index == 1){
                        comma = ",";
                    }
                     query += comma + this.select.expandData[index].getDeepExpandString();                    
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
                     let parenthesisCount = 0;       
         
                     for (let index = 0; index < this.filterData.length; index++) {
                         
                         let element = this.filterData[index];
                         let currentFieldName = element.field;
                         let openParanthesis = false;
                         let closeParanthesis = false;
         
                         if (lastFieldName != currentFieldName){
                             openParanthesis = true;
                             parenthesisCount++;
                             lastFieldName = currentFieldName;
                         }
         
                         if (index < this.filterData.length - 1)
                         {
                             if (this.filterData[index + 1].field != currentFieldName)
                             {
                                 closeParanthesis = true;
                                 parenthesisCount--;
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
                             if (parenthesisCount > 0 ||  (openParanthesis && !closeParanthesis))
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
 
         return  query;
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
      static getFilterData(element : FilterData, openParenthesis : boolean, closeParenthesis : boolean, variable : string = "") : string
      {         
          
          if (element.matchMode == MatchMode.startsWith || element.matchMode == MatchMode.endsWith || element.matchMode == MatchMode.contains)
          {                   
  
              return this.getFunctionFilter(element,openParenthesis,closeParenthesis,variable);
          }
          else 
          {               
              return this.getOperatorFilter(element,openParenthesis,closeParenthesis,variable);
          }
      } 
  
      
     /**
      * @description
      * Gets raw filter string from a filter data that uses a function such as contains, startsWith, endsWith.
      * */
      static getFunctionFilter(element : FilterData,openParenthesis : boolean,closeParenthesis : boolean,variable : string = ""){
  
          let beginParenthesis = openParenthesis ? "(" : "";
          let endParenthesis = closeParenthesis ? ")" : "";
 
          //let matchMode = (MatchMode as any)[element.matchMode]
          
          if (element.matchDirection == MatchDirection.inField){
              return beginParenthesis + element.matchMode + "(" + variable + element.field + ", " + this.getValue(element) + ")" + endParenthesis;
          }
          else {
              return beginParenthesis + element.matchMode + "(" + this.getValue(element) + ", " + variable + element.field + ")" + endParenthesis;
          }
      }
  
 
     /**
      * @description
      * Gets raw filter string from a filter data that uses an operator such as eq, ne, gt, lt, ge, le.
      * */
      static getOperatorFilter(element : FilterData,openParenthesis : boolean,closeParenthesis : boolean,variable : string = "") : string{
  
          let beginParenthesis = openParenthesis ? "(" : "";
          let endParenthesis = closeParenthesis ? ")" : "";
          
          
 
          if (element.matchDirection == MatchDirection.inField){
              return beginParenthesis + variable + element.field + " " + element.matchMode + " " + this.getValue(element) + endParenthesis;
          }
          else {
              return beginParenthesis + this.getValue(element) + " " +  element.matchMode + " " + variable + element.field + endParenthesis;
             
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
      static getAnyFilterData(element : AnyFilterData,openParenthesis : boolean,closeParenthesis : boolean, depth : number, variable : string = "a") : string {
  
          let anyVariables = "abcdefghijklmnopqrstuvwxyz";
          let beginParenthesis = openParenthesis ? "(" : "";
          let endParenthesis = closeParenthesis ? ")" : "";
      
          if (element.FilterData instanceof FilterData){
           
            return beginParenthesis + element.field + "/any(" + variable + " :" + this.getFilterData(element.FilterData as FilterData,false,false, variable + "/") + ")" + endParenthesis             
                         
          }
          else {
               
  
              return beginParenthesis + element.field + "/any(" + anyVariables[depth] + " : " + anyVariables[depth] + "/" + this.getAnyFilterData(element.FilterData as AnyFilterData,false,false,depth + 1,anyVariables[depth]) + ")" + endParenthesis; 
            
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
          else if (typeof element.value == "boolean") {
            return element.value;
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