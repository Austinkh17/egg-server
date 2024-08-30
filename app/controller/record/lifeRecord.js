const Controller = require('../common');
const moment = require('moment');
const fs = require('fs');

class LifeRecordController extends Controller {

  async getLifeRecordList() {
    let { ctx, app } = this
    let { sort, sortIndex, pageSize, currentPage } = ctx.query
    const skipNum = (Number(currentPage) - 1) * Number(pageSize)
    let query = ctx.query
    delete query.sort
    delete query.sortIndex
    delete query.pageSize
    delete query.currentPage
    let sortParams = {}
    sortParams[sort] = sortIndex
    if (!sortParams.hasOwnProperty('time_str')) sortParams['time_str'] = -1
    sortParams['_id'] = 1  //防止排序参数相同时，分页出现重复项
    if (query.hasOwnProperty('role')) {
      let arr = query.role.split(',')
      !query['$or'] && (query['$or'] = [])
      arr.forEach(i => {
        query['$or'].push({ hero_type: i }, { hero_type2: i })
      })
      delete query.role
    }
    console.log('查询参数', sort, sortIndex, pageSize, currentPage, skipNum, sortParams, Number(pageSize), JSON.stringify(query))
    await Promise.all([
      app.model.LifeRecord.count(query),
      app.model.LifeRecord.find(query).collation({ "locale": "zh", numericOrdering: true }).sort(sortParams).skip(skipNum).limit(Number(pageSize)),
    ])
      .then((data) => {
        return ctx.body = {
          code: 200,
          data: data[1],
          total: data[0],
          message: '查询成功'
        }
      })
      .catch((error) => {
        return ctx.body = {
          code: 1,
          message: error
        }
      })
  }

}

module.exports = LifeRecordController;