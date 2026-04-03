import { Field, InputType } from "@nestjs/graphql";

@InputType()
export class updateRoleInput{
    @Field(() => String)
    id: string;

    @Field()
    name: string;
}
