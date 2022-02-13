import { roundValueForPresentation as r } from 'cad/craft/operationHelper';
import { MFace } from "cad/model/mface";
import { ApplicationContext } from "context";
import { MDFCommand } from "cad/mdf/mdf";
import { EntityKind } from "cad/model/entities";
import Vector from "math/vector";
import { BooleanDefinition } from "cad/craft/schema/common/BooleanDefinition";
import * as vec from "math/vec";
import Axis from "math/axis";

interface RevolveParams {
  angle: number;
  face: MFace;
  axis: Axis,
  boolean: BooleanDefinition
}
 
const RevolveOperation: MDFCommand<RevolveParams> = {
  id: 'Revolve',
  label: 'Revolve',
  icon: 'img/cad/Revolve',
  info: 'Revolves 2D sketch',
  paramsInfo: ({ angle }) => `(${r(angle)})`,
  mutualExclusiveFields: ['datumAxisVector', 'edgeVector', 'sketchSegmentVector'],
  run: (params: RevolveParams, ctx: ApplicationContext) => {
    console.log(params);
    let occ = ctx.occService;
    const oci = occ.commandInterface;

    const face = params.face;

    let sketch = ctx.sketchStorageService.readSketch(face.id);
    if (!sketch) throw 'sketch not found for the face ' + face.id;
    const occFaces = occ.utils.sketchToFaces(sketch, face.csys);


    const tools = occFaces.map((faceName, i) => {
      const shapeName = "Tool/" + i;
      var args = [shapeName, faceName, ...params.axis.origin.data(), ...params.axis.direction.data(), params.angle];
      oci.revol(...args);

      return shapeName;
    });








    return occ.utils.applyBooleanModifier(tools, params.boolean);

  },
  form: [
    {
      type: 'number',
      label: 'angle',
      name: 'angle',
      defaultValue: 360,
    },
    {
      type: 'selection',
      name: 'face',
      capture: [EntityKind.FACE],
      label: 'face',
      multi: false,
      defaultValue: {
        usePreselection: true,
        preselectionIndex: 0
      },
    },
    {
      type: 'axis',
      name: 'axis',
      label: 'axis',
      optional: false
    },
    {
      type: 'boolean',
      name: 'boolean',
      label: 'boolean',
      optional: true,
      defaultValue: 'NONE'
    }

  ],
}

export default RevolveOperation;