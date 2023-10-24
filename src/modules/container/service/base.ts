import {Provide} from "@midwayjs/decorator";
import {BaseService} from "@cool-midway/core";
import {InjectEntityModel} from "@midwayjs/orm";
import {Repository} from "typeorm";
import { ContainerEntity } from "../entity/base";

@Provide()
export class ContainerService extends BaseService {
  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>;

  
}