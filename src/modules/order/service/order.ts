import {Provide} from "@midwayjs/decorator";
import {BaseService} from "@cool-midway/core";

@Provide()
export class OrderService extends BaseService {
  async getCountMonth(departmentId){
    const year = new Date().getFullYear();
    const sql = `
        SELECT DATE_FORMAT(createTime,'%m') as month, count(*) as count FROM \`order\` WHERE
        DATE_FORMAT(createTime,'%Y') = '${year}'
          and departmentId = ${departmentId}
          and ( status = 1 or status = 3)
          GROUP BY DATE_FORMAT(createTime,'%m');`
    const sql2 = `
        SELECT DATE_FORMAT(createTime,'%m') as month, count(*) as count FROM \`order\` WHERE
        DATE_FORMAT(createTime,'%Y') = '${year}'
          and departmentId = ${departmentId}
          GROUP BY DATE_FORMAT(createTime,'%m');
    `
    const list1 = await this.nativeQuery(sql)
    const list2 = await this.nativeQuery(sql2)
    return {
      order: list1,
      lead: list2
    }
  }
}
