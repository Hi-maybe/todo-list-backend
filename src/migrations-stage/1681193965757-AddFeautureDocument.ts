import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeautureDocument1681193965757 implements MigrationInterface {
    name = 'AddFeautureDocument1681193965757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "todolist_stage"."document" ("id" character varying NOT NULL, "name" character varying NOT NULL, "content" text, "favorite" boolean NOT NULL DEFAULT false, "parentId" character varying, "todolistId" character varying NOT NULL, CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "todolist_stage"."document" ADD CONSTRAINT "FK_0f10c2404755fd85c4cfa5f61be" FOREIGN KEY ("todolistId") REFERENCES "todolist_stage"."todolist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "todolist_stage"."document" ADD CONSTRAINT "FK_4c4ae8a7a98116d84d0ecb087b9" FOREIGN KEY ("parentId") REFERENCES "todolist_stage"."document"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todolist_stage"."document" DROP CONSTRAINT "FK_4c4ae8a7a98116d84d0ecb087b9"`);
        await queryRunner.query(`ALTER TABLE "todolist_stage"."document" DROP CONSTRAINT "FK_0f10c2404755fd85c4cfa5f61be"`);
        await queryRunner.query(`DROP TABLE "todolist_stage"."document"`);
    }

}
