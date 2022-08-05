sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Control',
    'sap/m/FlexAlignItems',
    'sap/m/FlexJustifyContent',
    'sap/ui/yesco/common/AppUtils',
  ],
  function (
    // prettier 방지용 주석
    Control,
    FlexAlignItems,
    FlexJustifyContent,
    AppUtils
  ) {
    'use strict';

    return Control.extend('sap.ui.yesco.control.D3OrgChart', {
      metadata: {
        properties: {
          title: { type: 'string', group: 'Misc', defaultValue: '{i18n>LABEL_12001}' },
          extendNode: { type: 'string', group: 'Misc', defaultValue: '' },
          layout: { type: 'string', group: 'Misc', defaultValue: 'top' },
          compact: { type: 'boolean', group: 'Misc', defaultValue: false },
        },
        aggregations: {
          items: { type: 'sap.ui.yesco.control.D3OrgChartItem', multiple: true, singularName: 'item' },
        },
        defaultAggregation: 'items',
      },

      createChart() {
        const oChartLayout = new sap.m.VBox({ height: '100%', alignItems: FlexAlignItems.Center, justifyContent: FlexJustifyContent.Center });
        const oChartFlexBox = new sap.m.FlexBox({ width: `${$(document).width()}px`, height: '100%', alignItems: FlexAlignItems.Center });

        this.sParentId = oChartFlexBox.getIdForLabel();
        oChartLayout.addItem(oChartFlexBox);

        return oChartLayout;
      },

      getChart() {
        return this.oD3Chart;
      },

      renderer(oRm, oControl) {
        const layout = oControl.createChart();

        oRm.write('<div style="height:100%"');
        oRm.writeControlData(layout);
        oRm.writeClasses();
        oRm.write('>');
        oRm.renderControl(layout);
        oRm.addClass('verticalAlignment');
        oRm.write('</div>');
      },

      onAfterRendering() {
        const mItems = this.getItems();
        const iSvgHeightPadding = AppUtils.isMobile() ? 276 : 10;
        const aChartData = [];

        mItems.forEach((item) => {
          aChartData.push({ ...item.mProperties });
        });

        this.oD3Chart = null;
        this.oD3Chart = new d3.OrgChart()
          .container(`#${this.sParentId}`)
          .svgHeight(window.innerHeight - iSvgHeightPadding)
          .data(aChartData)
          .layout(this.getLayout())
          .compact(this.getCompact())
          .setActiveNodeCentered(true)
          .nodeWidth(() => 360)
          .nodeHeight(() => 178)
          .initialZoom(0.8)
          .childrenMargin(() => 40)
          .compactMarginBetween(() => 25)
          .compactMarginPair(() => 80)
          .linkUpdate(function (d) {
            d3.select(this)
              .attr('stroke', (d) => (d.data._upToTheRootHighlighted ? '#c6c6c6' : '#c6c6c6'))
              .attr('stroke-width', (d) => (d.data._upToTheRootHighlighted ? 3 : 1));

            if (d.data._upToTheRootHighlighted) {
              d3.select(this).raise();
            }
          })
          .nodeContent(function (o) {
            const sSuccessionDisplay = o.data.Scspln ? '' : ' display-none';
            const bSuccessionPlanOnly = o.data.Scspln && !(o.data.CpPernr || '').replace(/0+/, '') ? ' only' : '';
            return `<div class="org-container">
  <div class="title level${o.data.ZorgLevl}">${o.data.Stext}</div>
  <div class="grid employee-information">
    <div class="photo"><span style="background-image:url('${o.data.Photo}')" /></div>
    <div class="name">${o.data.Ename}</div>
    <div class="spacer"></div>
    <div class="label">${o.data.JikgbtlLabel}</div>
    <div class="content">${o.data.Jikgbtl}</div>
    <div class="spacer"></div>
    <div class="label">${o.data.IpdatLabel}</div>
    <div class="content">${o.data.Ipdat}</div>
    <div class="spacer"></div>
    <div class="label">${o.data.TenureLabel}</div>
    <div class="content">${o.data.Tenure}</div>
  </div>
  <div class="grid succession succession-plan${sSuccessionDisplay}${bSuccessionPlanOnly}">
    <div class="dummy"></div>
    <div class="label">${o.data.ScsplnLabel}</div>
    <div class="content">${o.data.Scspln}</div>
    <div class="spacer"></div>
    <div class="label">${o.data.ScspntLabel}</div>
    <div class="content">${o.data.Scspnt}</div>
  </div>
  <div class="grid succession successor">
    <div class="photo"><span style="background-image:url('${o.data.CpPhoto}')" /></div>
    <div class="label">${o.data.Cand1stLabel}</div>
    <div class="content">${o.data.Cand1st1}</div>
    <div class="spacer" style="line-height:3px"></div>
    <div class="content" style="text-align:right">${o.data.Cand1st2}</div>
    <div class="content">${o.data.Cand1st3}</div>
    <div class="spacer"></div>
    <div class="label">${o.data.CandpntLabel}</div>
    <div class="content">${o.data.Candpnt}</div>
  </div>
</div>`;
          })
          .onNodeClick(function (event, sNodeId) {
            const oDesktop = sap.ui.getCore().byId('container-ehr---m_organization--ChartHolder');
            const oMobile = sap.ui.getCore().byId('container-ehr---mobile_m_organization--ChartHolder');
            const oViewModel = oDesktop ? oDesktop.getModel() : oMobile.getModel();
            const sPernr = _.find(this.data, { nodeId: sNodeId }).Pernr;
            const aRoutePath = oDesktop ? ['employee', 'employee'] : ['mobile/employee', 'mobile/m/employee-org'];
            const $element = $(event.srcElement);
            const bTitle = $element.hasClass('title');
            const oRouter = AppUtils.getAppComponent().getRouter();

            oViewModel.setProperty('/extendNode', sNodeId);

            if (!sPernr) {
              if (bTitle) {
                oRouter.navTo(aRoutePath[1], { pernr: 'NA', orgeh: sNodeId, orgtx: _.replace(event.srcElement.textContent, /\//g, '--') });
              }
            } else {
              if (bTitle) {
                oRouter.navTo(aRoutePath[1], { pernr: sPernr, orgeh: sNodeId, orgtx: _.replace(event.srcElement.textContent, /\//g, '--') });
              } else {
                if ($element.hasClass('succession') || $element.parents('.succession').length) {
                  const sCpPernr = (_.find(this.data, { nodeId: sNodeId }).CpPernr || '').replace(/0+/, '');
                  if (!sCpPernr) {
                    return;
                  }

                  if (AppUtils.isMobile()) {
                    oRouter.navTo(aRoutePath[0], { pernr: sCpPernr });
                  } else {
                    const sHost = window.location.href.split('#')[0];
                    window.open(`${sHost}#/employeeView/${sCpPernr}/M`, '_blank', 'width=1400,height=800');
                  }
                } else {
                  oRouter.navTo(aRoutePath[0], { pernr: sPernr });
                }
              }
            }
          })
          .render()
          .fit();

        if (!_.isEmpty(this.getExtendNode())) {
          this.oD3Chart.setExpanded(this.getExtendNode()).setCentered(this.getExtendNode()).render();
          // .setHighlighted(this.getExtendNode())
        }
      },
    });
  }
);
