import {roundValueForPresentation as r} from 'cad/craft/operationHelper';
import {ApplicationContext} from "context";
import {EntityKind} from "cad/model/entities";
import {OperationDescriptor} from "cad/craft/operationPlugin";
import { MFace } from "cad/model/mface";
import { BooleanDefinition } from "cad/craft/schema/common/BooleanDefinition";
import { UnitVector } from "math/vector";
import { MObject } from "cad/model/mobject";
import {Interrogate, SetLocation} from "cad/craft/e0/interact";
import {MDatum} from "cad/model/mdatum";

interface HoleParams {
  datum: MDatum;
  diameter: number;
  depth: number;
  counterBoreDiameter: number;
  counterBoreDepth: number;
  countersinkDiameter: number;
  countersinkAngle: number;
  holeType: string;
}

export const HoleOperation: OperationDescriptor<HoleParams> = {
  id: 'HOLE_TOOL',
  label: 'hole',
  icon: 'img/cad/hole',
  info: 'creates hole features',
  paramsInfo: ({

    diameter,
    depth,
    counterBoreDiameter,
    counterBoreDepth,
    countersinkDiameter,
    countersinkAngle,
    holeType,
  }) => `(${r(depth)} ${r(counterBoreDiameter)})  ${r(counterBoreDepth)})`,

  run: async (params: HoleParams, ctx: ApplicationContext) => {
    console.log(params);
    let occ = ctx.occService;
    const oci = occ.commandInterface;

    var returnObject = {
      consumed: [],
      created: []
    };

    //let sketch = ctx.sketchStorageService.readSketch(params.sketch.id);
    //console.log(sketch, "sketch info here");


    oci.pcylinder("result", params.diameter / 2, params.depth);

    // if (params.holeType == "normal") {
    //   returnObject.created.push(occ.io.getShell("basehole"));
    // }

    if (params.holeType == "counterbore") {
      oci.pcylinder("counterbore", params.counterBoreDiameter / 2, params.counterBoreDepth);

      oci.bop("result", "counterbore");
      oci.bopfuse("result"); 
    }

    if (params.holeType == "countersink") {

      let heightFromDiameterAndAngle = (params.countersinkDiameter - params.diameter) / (Math.tan((params.countersinkAngle / 180 * Math.PI) / 2));


      oci.pcone("countersink", params.countersinkDiameter / 2, 0, heightFromDiameterAndAngle);
      oci.bop("result", "countersink");
      oci.bopfuse("result");
    }

    let ptr = Interrogate("result", true).ptr;
    console.log(params.datum.csys.outTransformation);
    const location = await params.datum.csys.outTransformation.toFlatArray();
    SetLocation(ptr, location);
    returnObject.created.push(occ.io.getShell("result"));
    console.log(returnObject);

    return returnObject;

  },
  form: [
    {
      type: 'selection',
      name: 'datum',
      capture: [EntityKind.DATUM],
      label: 'Sketch',
      multi: false,
      defaultValue: {
        usePreselection: true,
        preselectionIndex: 0
      },
    },

    {
      type: 'choice',
      label: 'HoleType',
      name: "holeType",
      style: "dropdown",
      defaultValue: "counterbore",
      values: ['counterbore', 'countersink', 'normal',],
    },


    {
      type: 'number',
      name: "diameter",
      defaultValue: 10,
      label: 'Hole ⌀'
    },
    {
      type: 'number',
      name: "depth",
      defaultValue: 100,
      label: 'Hole ↧'
    },


    {
      type: 'number',
      name: "counterBoreDiameter",
      defaultValue: 20,
      label: '⌴ ⌀'
    },
    {
      type: 'number',
      name: "counterBoreDepth",
      defaultValue: 10,
      label: '⌴ ↧'
    },


    {
      type: 'number',
      name: "countersinkDiameter",
      defaultValue: 20,
      label: '⌵ ⌀'
    },
    {
      type: 'number',
      name: "countersinkAngle",
      defaultValue: 90,
      label: '⌵ Angle'
    },
  ],
}
