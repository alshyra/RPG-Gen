import { ApiProperty } from "@nestjs/swagger";

export class ClassDto{
  @ApiProperty({description: "Unique identifier for the class"})
  name: string;
  @ApiProperty({description: "Display name of the class"})
  displayName: string;
  @ApiProperty({description: "Description of the class"})
  description: string;
  @ApiProperty({description: "Base hit points of the class"})
  hp_base: number;
  @ApiProperty({description: "Hit points gained per level"})
  hp_gain: number;
  @ApiProperty({description: "Action points of the class"})
  pa: number;
  @ApiProperty({description: "Movement points of the class"})
  pm: number;
  @ApiProperty({description: "Main stat of the class could be vigor, finesse, mind or survival"})
  main_stat: string;
  @ApiProperty({description: "Proficiencies of the class"})
  proficiencies: string[];
  @ApiProperty({description: "Starting aptitudes of the class"})
  startingAptitudes: string[];
  @ApiProperty({description: "Color associated with the class"} )
  color: string;
  @ApiProperty({description: "Icon representing the class"})
  icon: string;

}
