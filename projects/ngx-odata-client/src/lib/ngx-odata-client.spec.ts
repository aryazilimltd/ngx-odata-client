//create test module

import { AnyFilterData, Filter, FilterData, MatchMode, NegateFilterData, QueryData, SelectData } from "./ngx-odata-client";

//import { AnyFilterData, FilterData, MatchMode, NegateFilterData, QueryData, SelectData } from "ngx-odata-client";

describe('SelectQuery', () => {

    QueryData.setSkip = 0;
    QueryData.setTop = 10;
    QueryData.setPagination = true;
    QueryData.setShowCount = true;
    let query = new QueryData();
    query.select = "*";

    it('url with select all(*) should be created', () => {
        expect(query.getHttpParams().toString()).toBe("$select=*&$top=10&$skip=0&$count=true");
    });

    let query2 = new QueryData();
    query2.select = 'Id';

    it('url with select one field should be created', () => {
        expect(query2.getHttpParams().toString()).toBe("$select=Id&$top=10&$skip=0&$count=true");
    })

    let query3 = new QueryData();
    query3.select = 'Id,Name';

    it('url with select multiple fields should be created', () => {
        expect(query3.getHttpParams().toString()).toBe("$select=Id,Name&$top=10&$skip=0&$count=true");
    })

    let query4 = new QueryData();
    query4.select = ['Id', 'Name'];

    it('url with select multiple fields should be created (array)', () => {
        expect(query4.getHttpParams().toString()).toBe("$select=Id,Name&$top=10&$skip=0&$count=true");
    })

    let query5 = new QueryData();
    
    it('without select clause', () => {
        expect(query5.getHttpParams().toString()).toBe("$top=10&$skip=0&$count=true");
    })
    
});

describe('Filter modes', () => {

    QueryData.setSkip = 0;
    QueryData.setTop = 10;
    QueryData.setPagination = true;
    QueryData.setShowCount = true;
    let query = new QueryData();

    query.filter = new Filter();
    query.filter.Expr("Id",MatchMode.equals,1);

    it('url with single filter should be created', () => {
        expect(decodeURI(query.getHttpParams().toString())).toBe("$filter=Id eq 1&$top=10&$skip=0&$count=true");
    })


    let query2 = new QueryData();

    query2.filter = new Filter();
    query2.filter.Expr("Id",MatchMode.greaterThan,1).And().Expr("Name",MatchMode.notEquals,"test");

    it('url with multiple filter should be created', () => {
        expect(decodeURI(query2.getHttpParams().toString())).toBe("$filter=Id gt 1 and Name ne 'test'&$top=10&$skip=0&$count=true");
    })

    let query3 = new QueryData();

    query3.filter.Expr("date",MatchMode.contains,new Date(2018,1,1));

    it('url with function filter should be created', () => {
        expect(decodeURI(query3.getHttpParams().toString())).toBe("$filter=contains(date,2018-01-31T21:00:00.000Z)&$top=10&$skip=0&$count=true");
    })

    let query4 = new QueryData();
    query4.filter.Expr("name",MatchMode.contains,"test").And().BeginParenthesis().Expr("name",MatchMode.contains,"test2").Or().Expr("name",MatchMode.endsWith,"test3").EndParenthesis();

    it('url with mixed filter should be created', () => {
        expect(decodeURI(query4.getHttpParams().toString())).toBe("$filter=contains(name,'test') and (contains(name,'test2') or endsWith(name,'test3'))&$top=10&$skip=0&$count=true");
    })
})

describe('Negate filter', () => {

    QueryData.setSkip = 0;
    QueryData.setTop = 10;
    QueryData.setPagination = true;
    QueryData.setShowCount = true;
    let query = new QueryData();
    query.filter.Not().Expr("Id",MatchMode.equals,1);

    it('url with negate filter should be created', () => {
        expect(decodeURI(query.getHttpParams().toString())).toBe("$filter=Not Id eq 1&$top=10&$skip=0&$count=true");
    })

    let query2 = new QueryData();
    query2.filter.Not().Expr("Id",MatchMode.contains,1).And().Expr("Name",MatchMode.notEquals,"test");

    it('url with negate filter should be created', () => {
        expect(decodeURI(query2.getHttpParams().toString())).toBe("$filter=Not contains(Id,1) and Name ne 'test'&$top=10&$skip=0&$count=true");
    })
})

describe('Any filter',() => {
    QueryData.setSkip = 0;
    QueryData.setTop = 10;
    QueryData.setPagination = true;
    QueryData.setShowCount = true;
    var query = new QueryData();

    query.filter.Any("Posts").AddExpression("Id",MatchMode.equals,1).EndAny();

    it('url with any filter should be created', () => {
        expect(decodeURI(query.getHttpParams().toString())).toBe("$filter=Posts/any(x:x/Id eq 1)&$top=10&$skip=0&$count=true");
    })

    var query2 = new QueryData();

    query2.filter.Any("Posts").AddExpression("Id",MatchMode.equals,1).Or().AddExpression("Name",MatchMode.notEquals,"test").EndAny();

    it('url with multiple filter in any filter should be created', () => {
        expect(decodeURI(query2.getHttpParams().toString())).toBe("$filter=Posts/any(x:x/Id eq 1 or x/Name ne 'test')&$top=10&$skip=0&$count=true");
    })

    var query3 = new QueryData();

    query3.filter.Any("Posts").AddExpression("Id",MatchMode.equals,1).And().BeginParenthesis().AddExpression("Name",MatchMode.notEquals,"test").Or().AddExpression("Name",MatchMode.endsWith,"test3").EndParenthesis().And().Any("Authors").AddExpression("Name",MatchMode.endsWith,"mes").EndAny().EndAny();

    it('url with multiple filter in any filter should be created', () => {
        expect(decodeURI(query3.getHttpParams().toString())).toBe("$filter=Posts/any(x:x/Id eq 1 and (x/Name ne 'test' or endsWith(x/Name,'test3')) and x/Authors/any(y:endsWith(y/Name,'mes')))&$top=10&$skip=0&$count=true");
    })

    var query4 = new QueryData();
    query4.filter.Any("Posts").Any("Post/Authors").AddExpression("Name",MatchMode.endsWith,"mes").EndAny().EndAny();

    it('url with multiple filter in any filter should be created', () => {
        expect(decodeURI(query4.getHttpParams().toString())).toBe("$filter=Posts/any(x:x/Post/Authors/any(y:endsWith(y/Name,'mes')))&$top=10&$skip=0&$count=true");
    });
})

describe('All filter',() => {
    QueryData.setSkip = 0;
    QueryData.setTop = 10;
    QueryData.setPagination = true;
    QueryData.setShowCount = true;
    var query = new QueryData();

    query.filter.All("Posts").AddExpression("Id",MatchMode.equals,1).EndAll();

    it('url with any filter should be created', () => {
        expect(decodeURI(query.getHttpParams().toString())).toBe("$filter=Posts/all(x:x/Id eq 1)&$top=10&$skip=0&$count=true");
    })

    var query2 = new QueryData();

    query2.filter.All("Posts").AddExpression("Id",MatchMode.equals,1).Or().AddExpression("Name",MatchMode.notEquals,"test").EndAll();

    it('url with multiple filter in any filter should be created', () => {
        expect(decodeURI(query2.getHttpParams().toString())).toBe("$filter=Posts/all(x:x/Id eq 1 or x/Name ne 'test')&$top=10&$skip=0&$count=true");
    })

    var query3 = new QueryData();

    query3.filter.All("Posts").AddExpression("Id",MatchMode.equals,1).And().BeginParenthesis().AddExpression("Name",MatchMode.notEquals,"test").Or().AddExpression("Name",MatchMode.endsWith,"test3").EndParenthesis().And().All("Authors").AddExpression("Name",MatchMode.endsWith,"mes").EndAll().EndAll();

    it('url with multiple filter in any filter should be created', () => {
        expect(decodeURI(query3.getHttpParams().toString())).toBe("$filter=Posts/all(x:x/Id eq 1 and (x/Name ne 'test' or endsWith(x/Name,'test3')) and Authors/all(y:endsWith(y/Name,'mes')))&$top=10&$skip=0&$count=true");
    })
})

describe('count filter', () => {
    QueryData.setSkip = 0;
    QueryData.setTop = 10;
    QueryData.setPagination = true;
    QueryData.setShowCount = true;
    var query1 = new QueryData();
    query1.filter.Count("Posts").AddExpression("Id",MatchMode.equals,1).EndCount(MatchMode.equals,1);

    it('url with count filter should be created', () => {
        expect(decodeURI(query1.getHttpParams().toString())).toBe("$filter=Posts/$count($filter=Id eq 1) eq 1&$top=10&$skip=0&$count=true");
    })

    var query2 = new QueryData();
    query2.filter.Count("Posts").AddExpression("Id",MatchMode.equals,1).EndCount(MatchMode.equals,1).And().Count("Authors").AddExpression("Name",MatchMode.endsWith,"mes").EndCount(MatchMode.equals,1);

    it('url with count filter should be created', () => {
        expect(decodeURI(query2.getHttpParams().toString())).toBe("$filter=Posts/count($filter=Id eq 1) eq 1 and Authors/count($filter=endsWith(Name,'mes')) eq 1&$top=10&$skip=0&$count=true");
    }  )
})


describe('expand filter',()=> {
    QueryData.setSkip = 0;
    QueryData.setTop = 10;
    QueryData.setPagination = true;
    QueryData.setShowCount = true;
    var query = new QueryData();

    query.expand.add("Posts");

    it('url with expand should be created', () => {
        expect(decodeURI(query.getHttpParams().toString())).toBe("$expand=Posts&$top=10&$skip=0&$count=true");
    })

    var query2 = new QueryData();
    query2.expand.add("Posts").select("Id,Name");

    it('url with expand and select should be created', () => {
        expect(decodeURI(query2.getHttpParams().toString())).toBe("$expand=Posts($select=Id,Name)&$top=10&$skip=0&$count=true");
    });

    var query3 = new QueryData();
    query3.expand.add("Posts").select("Id,Name").beginFilter().AddExpression("Id",MatchMode.equals,1).EndExpandFilter();

    it('url with expand and select should be created', () => {
        expect(decodeURI(query3.getHttpParams().toString())).toBe("$expand=Posts($select=Id,Name;$filter=Id eq 1)&$top=10&$skip=0&$count=true");
    })

    var query4 = new QueryData();

    query4.expand.add("Posts").select("Id,Name").beginFilter().AddExpression("Id",MatchMode.equals,1).And().AddExpression("Name",MatchMode.contains,"1").EndExpandFilter().expand("Authors").select("Id,Name");
    query4.expand.add("Authors").select("Id,Name");

    it('url with expand and select should be created', () => {
        expect(decodeURI(query4.getHttpParams().toString())).toBe("$expand=Posts($select=Id,Name;$expand=Authors($select=Id,Name);$filter=Id eq 1 and contains(Name,'1')),Authors($select=Id,Name)&$top=10&$skip=0&$count=true");
    })
})


describe('order by', () => {
    QueryData.setSkip = 0;
    QueryData.setTop = 10;
    QueryData.setPagination = true;
    QueryData.setShowCount = true;
    var query = new QueryData();
    query.orderBy.Asc("Id");

    it('url with order by should be created', () => {
        expect(decodeURI(query.getHttpParams().toString())).toBe("$orderby=Id asc&$top=10&$skip=0&$count=true");
    }  )

    var query2 = new QueryData();
    query2.orderBy.Desc("Id");

    it('url with order by desc should be created', () => {
        expect(decodeURI(query2.getHttpParams().toString())).toBe("$orderby=Id desc&$top=10&$skip=0&$count=true");
    })

    var query3 = new QueryData();
    query3.orderBy.Asc("Id").Asc("Name");

})

