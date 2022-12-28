sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/control/D3OrgChart',
    'sap/ui/yesco/control/D3OrgChartItem',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    BaseController,
    AppUtils,
    Client,
    ServiceNames,
    MessageBox,
    D3OrgChart,
    D3OrgChartItem
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.organization.mobile.Main', {
      LAYOUT: { top: 'left', left: 'top' },
      CARD_HEIGHT: {
        BASE: 178,
        EXTRA: 112,
      },

      async onBeforeShow() {
        this.chartHolder = this.byId('ChartHolder');
        this.chartHolder.setBusy(true);
        this.chartHolder.removeAllItems();
        this.oD3Chart = null;
      },

      async onObjectMatched() {
        try {
          let aThirdLevelNodeIds = [];

          if (_.isEmpty(this.getViewModel())) {
            const fCurriedPA = Client.getEntitySet(this.getModel(ServiceNames.PA));
            const mAppointee = this.getAppointeeData();
            const [aWerks, [{ Auth }], aOrgLevel, aReturnData] = await Promise.all([
              Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'WerksList', { Pernr: mAppointee.Pernr }), //
              Client.getEntitySet(this.getModel(ServiceNames.TALENT), 'SuccessionAuth'), // 승계 정보 조회 권한
              fCurriedPA('Orglevel'),
              fCurriedPA('EmployeeOrgTree', {
                Menid: this.getCurrentMenuId(),
                Werks: mAppointee.Werks,
                Stdat: moment().hour(9).toDate(),
              }),
            ]);

            if (_.isEmpty(aReturnData)) {
              MessageBox.alert(this.getBundleText('MSG_12002')); // 조회된 조직도 정보가 없습니다.
            }

            setTimeout(() => {
              if (Auth === 'X') {
                const oCompactButton = this.byId('compactButton');
                const oOverflowToolbar = oCompactButton.getParent();
                const oSuccessionButton = new sap.m.Button({
                  type: 'Emphasized',
                  width: '175px',
                  text: '{= ${/successionOn} ? ${i18n>LABEL_12013} : ${i18n>LABEL_12012} }', // 후임자 Off : 후임자 On
                  press: this.onPressSuccessionBtn.bind(this),
                });
                oOverflowToolbar.insertContent(oSuccessionButton, oOverflowToolbar.indexOfContent(oCompactButton) + 1);
              }
            });

            const oViewModel = new JSONModel({
              extendNode: '',
              layout: 'left',
              compact: false,
              successionOn: false,
              orgLevel: aOrgLevel ?? [],
              orgList: this.getOrgList(aReturnData),
              entry: {
                Werks: _.map(aWerks, (o) => _.omit(o, '__metadata')),
              },
              search: { Werks: mAppointee.Werks },
            });
            oViewModel.setSizeLimit(1000);
            this.setViewModel(oViewModel);

            if (mAppointee.Werks === '1000') {
              aThirdLevelNodeIds = _.chain(aReturnData)
                .filter({ Upobjid: _.chain(aReturnData).find({ Upobjid: '' }).get('Objid').value() })
                .map((o) => {
                  return _.chain(aReturnData).filter({ Upobjid: o.Objid }).head().get('Objid').value();
                })
                .value();
            }
          }

          const oViewModel = this.getViewModel();
          const sExtendNode = oViewModel.getProperty('/extendNode') || _.noop();
          const sLayout = oViewModel.getProperty('/layout') || 'left';
          const bCompact = oViewModel.getProperty('/compact');
          const bSuccessionOn = oViewModel.getProperty('/successionOn');

          this.oD3Chart = new D3OrgChart({
            extendNode: sExtendNode,
            layout: sLayout,
            compact: bCompact,
            extraHeight: bSuccessionOn ? this.CARD_HEIGHT.EXTRA : 0,
            items: this.getChartItems(),
          });

          this.chartHolder.addItem(this.oD3Chart);

          if (!_.isEmpty(aThirdLevelNodeIds)) {
            setTimeout(() => {
              const oChartControl = this.oD3Chart.getChart();

              aThirdLevelNodeIds.forEach((d) => oChartControl.setExpanded(d));

              oChartControl.render().fit();
            }, 300);
          } else {
            setTimeout(() => this.oD3Chart.getChart().render().fit(), 200);
          }
        } catch (oError) {
          this.debug('Controller > organization Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.chartHolder.setBusy(false);
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressSwapBtn(oEvent) {
        const oViewModel = this.getViewModel();
        const oChart = this.oD3Chart.getChart();
        const sCurrentLayout = oChart.layout();
        const sSwapLayout = this.LAYOUT[sCurrentLayout];

        oEvent.getSource().setText(sSwapLayout === 'left' ? this.getBundleText('LABEL_12008') : this.getBundleText('LABEL_12009')); // Horizontal : Vertical
        oViewModel.setProperty('/layout', sSwapLayout);
        oChart.layout(sSwapLayout).render().fit();
      },

      onPressCompactBtn(oEvent) {
        const oViewModel = this.getViewModel();
        const oChart = this.oD3Chart.getChart();
        const bCompact = oChart.compact();

        oEvent.getSource().setText(bCompact ? this.getBundleText('LABEL_12011') : this.getBundleText('LABEL_12010')); // Compact : Spread
        oViewModel.setProperty('/compact', !bCompact);
        oChart.compact(!bCompact).render().fit();
      },

      onPressSuccessionBtn() {
        const oViewModel = this.getViewModel();
        const oChart = this.oD3Chart.getChart();
        const bSuccessionOn = !oViewModel.getProperty('/successionOn');

        oViewModel.setProperty('/successionOn', bSuccessionOn);
        oChart.nodeHeight(() => (bSuccessionOn ? this.CARD_HEIGHT.BASE + this.CARD_HEIGHT.EXTRA : this.CARD_HEIGHT.BASE)).render();
      },

      async onChangeWerks(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          this.chartHolder.setBusy(true);
          this.chartHolder.removeAllItems();

          const sWerks = oEvent.getParameter('changedItem').getKey();
          const aReturnData = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'EmployeeOrgTree', {
            Menid: this.getCurrentMenuId(),
            Werks: sWerks,
            Stdat: moment().hour(9).toDate(),
          });

          if (_.isEmpty(aReturnData)) {
            MessageBox.alert(this.getBundleText('MSG_12002')); // 조회된 조직도 정보가 없습니다.
          }

          oViewModel.setProperty('/orgList', this.getOrgList(aReturnData));

          const sLayout = oViewModel.getProperty('/layout');
          const bCompact = oViewModel.getProperty('/compact');
          const bSuccessionOn = oViewModel.getProperty('/successionOn');

          this.oD3Chart = new D3OrgChart({
            extendNode: null,
            layout: sLayout,
            compact: bCompact,
            extraHeight: bSuccessionOn ? this.CARD_HEIGHT.EXTRA : 0,
            items: this.getChartItems(),
          });

          this.chartHolder.addItem(this.oD3Chart);

          if (sWerks === '1000') {
            const aThirdLevelNodeIds = _.chain(aReturnData)
              .filter({ Upobjid: _.chain(aReturnData).find({ Upobjid: '' }).get('Objid').value() })
              .map((o) => {
                return _.chain(aReturnData).filter({ Upobjid: o.Objid }).head().get('Objid').value();
              })
              .value();

            setTimeout(() => {
              const oChartControl = this.oD3Chart.getChart();

              aThirdLevelNodeIds.forEach((d) => oChartControl.setExpanded(d));

              oChartControl.render().fit();
            }, 200);
          }
        } catch (oError) {
          this.debug('Controller > Organization > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.chartHolder.setBusy(false);
        }
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/

      getOrgList(aReturnData) {
        const sUnknownAvatarImageURL = this.getUnknownAvatarImageURL();
        if (_.isEmpty(aReturnData)) {
          return [
            {
              Photo: sUnknownAvatarImageURL,
              Stdat: '',
              Stext: '',
              Pernr: '',
              Ename: '',
              IpdatLabel: this.getBundleText('LABEL_00235'), // 입사일
              Ipdat: '',
              Botxt: '',
              JikgbtlLabel: this.getBundleText('LABEL_00215'), // 직급
              Jikgbtl: '',
              ZorgLevl: '',
              TenureLabel: this.getBundleText('LABEL_12101'), // 현부서 재임기간
              Tenure: '',
              ScsplnLabel: this.getBundleText('LABEL_12102'), // 차년도 승계계획
              Scspln: '',
              ScspntLabel: this.getBundleText('LABEL_12103'), // 예정시점
              Scspnt: '',
              Cand1stLabel: this.getBundleText('LABEL_12104'), // 후보자(1순위)
              Cand1st1: '',
              Cand1st2: '',
              Cand1st3: '',
              CandpntLabel: this.getBundleText('LABEL_12105'), // 가능시점
              Candpnt: '',
              CpPernr: '',
              CpPhoto: '',
            },
          ];
        }
        return _.map(aReturnData, (o) => ({
          ...o,
          Photo: _.isEmpty(o.Photo) ? sUnknownAvatarImageURL : o.Photo,
          Ipdat: _.isDate(o.Ipdat) ? moment(o.Ipdat).format('YYYY.MM.DD') : '',
          JikgbtlLabel: this.getBundleText('LABEL_00215'), // 직급
          IpdatLabel: this.getBundleText('LABEL_00235'), // 입사일
          TenureLabel: this.getBundleText('LABEL_12101'), // 현부서 재임기간
          ScsplnLabel: this.getBundleText('LABEL_12102'), // 차년도 승계계획
          ScspntLabel: this.getBundleText('LABEL_12103'), // 예정시점
          Cand1stLabel: this.getBundleText('LABEL_12104'), // 후보자(1순위)
          CandpntLabel: this.getBundleText('LABEL_12105'), // 가능시점
        }));
      },

      getChartItems() {
        return {
          path: '/orgList',
          template: new D3OrgChartItem({
            nodeId: '{Objid}',
            parentNodeId: '{Upobjid}',
            Stdat: '{Stdat}',
            Stext: '{Stext}',
            Pernr: '{Pernr}',
            Ename: '{Ename}',
            IpdatLabel: '{IpdatLabel}',
            Ipdat: '{Ipdat}',
            Photo: '{Photo}',
            Botxt: '{Botxt}',
            JikgbtlLabel: '{JikgbtlLabel}',
            Jikgbtl: '{ path: "Jikgbtl", type: "sap.ui.yesco.mvc.model.type.ShortPosition" }',
            ZorgLevl: '{ZorgLevl}',
            TenureLabel: '{TenureLabel}',
            Tenure: '{Tenure}',
            ScsplnLabel: '{ScsplnLabel}', // 차년도 승계계획
            Scspln: '{Scspln}',
            ScspntLabel: '{ScspntLabel}', // 예정시점
            Scspnt: '{Scspnt}',
            Cand1stLabel: '{Cand1stLabel}', // 후보자(1순위)
            Cand1st1: '{ path: "Cand1st1", type: "sap.ui.yesco.mvc.model.type.ShortPosition" }', // 승계후보자(1순위)_성명/직급
            Cand1st2: '{Cand1st2}', // 승계후보자(1순위)_인사영역
            Cand1st3: '{Cand1st3}', // 승계후보자(1순위)_포지션
            CandpntLabel: '{CandpntLabel}', // 가능시점
            Candpnt: '{Candpnt}',
            CpPernr: '{CpPernr}',
            CpPhoto: '{CpPhoto}',
          }),
        };
      },
    });
  }
);
