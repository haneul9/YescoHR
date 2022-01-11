sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Element',
  ],
  function (
    // prettier 방지용 주석
    Element
  ) {
    'use strict';

    return Element.extend('sap.ui.yesco.control.D3OrgChartItem', {
      metadata: {
        properties: {
          nodeId: { type: 'String', defaultValue: null },
          parentNodeId: { type: 'String', defaultValue: null },
          Stdat: { type: 'Object', defaultValue: null },
          Stext: { type: 'String', defaultValue: null },
          Pernr: { type: 'String', defaultValue: null },
          Ename: { type: 'String', defaultValue: null },
          Ipdat: { type: 'String', defaultValue: null },
          Photo: { type: 'String', defaultValue: null },
          Botxt: { type: 'String', defaultValue: null },
          Jikgbtl: { type: 'String', defaultValue: null },
          ZorgLevl: { type: 'String', defaultValue: null },
          Tenure: { type: 'String', defaultValue: null },
        },
      },
    });
  }
);
