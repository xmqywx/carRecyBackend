import {Provide} from "@midwayjs/decorator";
import {BaseService} from "@cool-midway/core";
import {InjectEntityModel} from "@midwayjs/orm";
import {Repository} from "typeorm";
import { JobEntity } from "../entity/info";

@Provide()
export class JobService extends BaseService {
  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;
  
  async add(params) {
    return this.jobEntity.save(params);
  }

  async toDelete() {
    
  }
}