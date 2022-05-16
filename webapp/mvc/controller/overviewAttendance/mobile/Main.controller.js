sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/overviewAttendance/constants/ChartsSetting',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList1PopoverHandler',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList2PopoverHandler',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList3PopoverHandler',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList4PopoverHandler',
    'sap/ui/yesco/mvc/controller/overviewAttendance/mobile/EmployeeList5PopoverHandler',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    ChartsSetting,
    EmployeeList1PopoverHandler,
    EmployeeList2PopoverHandler,
    EmployeeList3PopoverHandler,
    EmployeeList4PopoverHandler,
    EmployeeList5PopoverHandler
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.overviewAttendance.mobile.Main', {
      initializeModel() {
        return {
          busy: false,
          searchConditions: {
            Datum: moment().hours(9).toDate(),
            Werks: '',
            Orgeh: '',
          },
          entry: {
            Werks: [],
            Orgeh: [],
          },
          contents: {
            A01: { busy: false, Headty: '', data: {} },
            A02: { busy: false, Headty: '', data: {} },
            A03: { busy: false, Headty: '', data: {} },
            A04: { busy: false, Headty: '', data: {} },
            A05: { busy: false, Headty: '' },
            A06: { busy: false, Headty: '' },
            A07: { busy: false, Headty: '' },
            A08: { busy: false, Headty: '', data: {} },
            A09: { busy: false, Headty: '', data: {} },
            // A10: { busy: false, Headty: '' },
          },
          dialog: {
            busy: false,
            rowCount: 0,
            param: {},
            list: [],
            sub: { list: [] },
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mAppointee = this.getAppointeeData();
          const [aPersaEntry, aOrgehEntry] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr: mAppointee.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointee.Werks, Pernr: mAppointee.Pernr }),
          ]);

          oViewModel.setProperty('/entry/Werks', aPersaEntry);
          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Werks', mAppointee.Werks);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.forEach(_.take(ChartsSetting.CHART_TYPE, 8), (o) => this.buildChart(oModel, mFilters, o));

          this.oEmployeeList1PopoverHandler = new EmployeeList1PopoverHandler(this);
          this.oEmployeeList2PopoverHandler = new EmployeeList2PopoverHandler(this);
          this.oEmployeeList3PopoverHandler = new EmployeeList3PopoverHandler(this);
          this.oEmployeeList4PopoverHandler = new EmployeeList4PopoverHandler(this);
          this.oEmployeeList5PopoverHandler = new EmployeeList5PopoverHandler(this);

          window.callAttendanceDetail = (sArgs) => {
            const aProps = ['Headty', 'Discod'];
            const aArgs = _.split(sArgs, ',');
            const mPayload = _.zipObject(_.take(aProps, aArgs.length), aArgs);

            this.callDetail(mPayload);
          };
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewAttendance Main > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        }
      },

      setAllBusy(bBusy) {
        const oViewModel = this.getViewModel();

        _.times(8).forEach((idx) => oViewModel.setProperty(`/contents/A${_.padStart(++idx, 2, '0')}/busy`, bBusy));
      },

      async buildChart(oModel, mFilters, mChartInfo) {
        const oViewModel = this.getViewModel();
        const aChartDatas = await Client.getEntitySet(oModel, 'TimeOverview', { ...mFilters, Headty: mChartInfo.Headty });
        const vDataObject = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data`);
        const mChartSetting = _.chain(ChartsSetting.CHART_OPTIONS).get(mChartInfo.Chart).cloneDeep().value();

        oViewModel.setProperty(`/contents/${mChartInfo.Target}/Headty`, mChartInfo.Headty);
        oViewModel.setProperty(`/contents/${mChartInfo.Target}/busy`, false);

        if (_.has(mChartInfo, 'Fields')) {
          oViewModel.setProperty(
            `/contents/${mChartInfo.Target}/data`,
            _.chain(vDataObject)
              .tap((obj) => _.forEach(mChartInfo.Fields, (o) => _.set(obj, o.prop, _.get(aChartDatas, o.path))))
              .value()
          );
        }

        switch (mChartInfo.Chart) {
          case 'cylinder':
            setTimeout(() => {
              const iChartHeight = $('.portlet-p06-chart-area').height() - $('.portlet-p06-chart-caption').height() - $('.portlet-p06-chart-value').height();

              _.chain(mChartSetting)
                .set(['chart', 'cylHeight'], iChartHeight - 20)
                .set(['chart', 'plotToolText'], AppUtils.getBundleText('LABEL_01122', '$dataValue')) // 출근율: <b>$dataValue%</b>
                .set('value', _.chain(aChartDatas).get([0, 'Rte01']).toNumber().value())
                .commit();

              mChartInfo.ChartHeight = iChartHeight;

              this.callFusionChart(mChartInfo, mChartSetting);
            }, 300);

            break;
          case 'column2d':
            let fColumn2dMaxValues = 0;
            _.chain(mChartSetting)
              .set(
                ['data'],
                _.map(aChartDatas, (o) => {
                  fColumn2dMaxValues = Math.max(fColumn2dMaxValues, Number(o.Cnt01));
                  return { label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` };
                })
              )
              .commit();

            mChartSetting.chart.yAxisMaxValue = Math.ceil(fColumn2dMaxValues * 1.3);

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'bar2d':
            let fBar2dMaxValues = 0;
            _.chain(mChartSetting)
              .set(
                ['data'],
                _.map(aChartDatas, (o) => {
                  fBar2dMaxValues = Math.max(fBar2dMaxValues, Number(o.Cnt01));
                  return { label: o.Ttltxt, value: o.Cnt01, color: '#7BB4EB', link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` };
                })
              )
              .commit();

            mChartSetting.chart.yAxisMaxValue = Math.ceil(fBar2dMaxValues * 1.3);

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'mscombi2d':
            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category', 0],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt }))
              )
              .set(['dataset', 0], {
                seriesName: this.getBundleText('LABEL_28048'), // 당일
                showValues: '1',
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt01, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` })),
              })
              .set(['dataset', 1], {
                seriesName: this.getBundleText('LABEL_00196'), // 누적
                renderAs: 'line',
                color: '#FFAC4B',
                data: _.map(aChartDatas, (o) => ({ value: o.Cnt02, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod02}` })),
              })
              .commit();

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          case 'mscolumn2d':
            let fMscolumn2dMaxValues = 0;
            _.chain(mChartSetting)
              .set(
                ['categories', 0, 'category', 0],
                _.map(aChartDatas, (o) => ({ label: o.Ttltxt.replace(/\(/, ' (') }))
              )
              .set(['dataset', 0], {
                seriesname: this.getBundleText('LABEL_32004'), // 법정
                color: '#7BB4EB',
                data: _.map(aChartDatas, (o) => {
                  fMscolumn2dMaxValues = Math.max(fMscolumn2dMaxValues, Number(o.Cnt01));
                  return { value: o.Cnt01, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod01}` };
                }),
              })
              .set(['dataset', 1], {
                seriesname: 'OT',
                color: '#FFAC4B',
                data: _.map(aChartDatas, (o) => {
                  fMscolumn2dMaxValues = Math.max(fMscolumn2dMaxValues, Number(o.Cnt02));
                  return { value: o.Cnt02, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod02}` };
                }),
              })
              .set(['dataset', 2], {
                seriesname: this.getBundleText('LABEL_32005'), // 초과인원
                color: '#FFE479',
                data: _.map(aChartDatas, (o) => {
                  fMscolumn2dMaxValues = Math.max(fMscolumn2dMaxValues, Number(o.Cnt03));
                  return { value: o.Cnt03, link: `j-callAttendanceDetail-${mChartInfo.Headty},${o.Cod03}` };
                }),
              })
              .commit();

            mChartSetting.chart.yAxisMaxValue = Math.ceil(fMscolumn2dMaxValues * 1.5);

            this.callFusionChart(mChartInfo, mChartSetting);

            break;
          default:
            break;
        }
      },

      callFusionChart(mChartInfo, mChartSetting) {
        if (_.isEmpty(mChartSetting)) return;

        const sChartId = `attendance-${_.toLower(mChartInfo.Target)}-chart`;

        if (!FusionCharts(sChartId)) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: sChartId,
              type: _.replace(mChartInfo.Chart, '-S', ''),
              renderAt: `${sChartId}-container`,
              width: _.has(mChartInfo, 'ChartWidth') ? mChartInfo.ChartWidth : '100%',
              height: _.has(mChartInfo, 'ChartHeight') ? mChartInfo.ChartHeight : '100%',
              dataFormat: 'json',
              dataSource: mChartSetting,
            }).render();

            FusionCharts.addEventListener('rendered', function () {
              if (mChartInfo.Target === 'A06' || mChartInfo.Target === 'A03') {
                $(`#employeeOnOff-${_.toLower(mChartInfo.Target)}-chart g[class$="-parentgroup"] > g[class$="-sumlabels"] > g[class$="-sumlabels"] > text`).each(function (idx) {
                  $(this)
                    .off('click')
                    .on('click', function () {
                      const oController = sap.ui.getCore().byId('container-ehr---m_overviewAttendance').getController();
                      const oViewModel = oController.getViewModel();
                      const sHeadty = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data/headty`);
                      const sDisyear = oViewModel.getProperty(`/contents/${mChartInfo.Target}/data/raw/${idx}/Ttltxt`);
                      const mPayload = _.zipObject(['Headty', 'Discod', 'Disyear'], [sHeadty, 'all', sDisyear]);

                      oController.callDetail(mPayload);
                    })
                    .addClass('active-link');
                });
              }
            });
          });
        } else {
          const oChart = FusionCharts(sChartId);

          oChart.setChartData(mChartSetting, 'json');
          setTimeout(() => oChart.render(), 200);
        }
      },

      formatDetailRowHighlight(sValue) {
        switch (_.toNumber(sValue)) {
          case 1:
            return sap.ui.core.IndicationColor.Indication03;
          case 2:
            return sap.ui.core.IndicationColor.Indication02;
          case 3:
            return sap.ui.core.IndicationColor.Indication04;
          default:
            return null;
        }
      },

      callDetail(mPayload) {
        const mSearchConditions = this.getViewModel().getProperty('/searchConditions');

        this.openDialog({ ..._.set(mSearchConditions, 'Datum', moment(mSearchConditions.Datum).hours(9).toDate()), ..._.pick(mPayload, ['Headty', 'Discod']) });
      },

      openDialog(mPayload) {
        switch (mPayload.Headty) {
          case 'A':
            this.oEmployeeList1PopoverHandler.openPopover(mPayload);
            break;
          case 'B':
          case 'C':
          case 'H':
          case 'I':
          case 'J':
            this.oEmployeeList3PopoverHandler.openPopover(mPayload);
            break;
          case 'D':
          case 'E':
          case 'F':
          case 'G':
            this.oEmployeeList2PopoverHandler.openPopover(mPayload);
            break;
          case 'X1':
            this.oEmployeeList4PopoverHandler.openPopover(mPayload);
            break;
          case 'X2':
            this.oEmployeeList5PopoverHandler.openPopover(mPayload);
            break;
          default:
            break;
        }

        $('#fusioncharts-tooltip-element').hide();
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          const mAppointee = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/searchConditions/Werks'),
            Pernr: mAppointee.Pernr,
          });

          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewAttendance Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          this.setAllBusy(true);

          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mFilters = oViewModel.getProperty('/searchConditions');

          _.set(mFilters, 'Datum', moment(mFilters.Datum).hours(9).toDate());

          _.forEach(_.take(ChartsSetting.CHART_TYPE, 8), (o) => setTimeout(() => this.buildChart(oModel, mFilters, o), 0));
        } catch (oError) {
          this.debug('Controller > mobile/m/overviewAttendance Main > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressCount(oEvent) {
        this.callDetail(oEvent.getSource().data());
      },

      onPressEmployeeRow(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();
        const sUsrty = this.isMss() ? 'M' : this.isHass() ? 'H' : '';

        window.open(`${sHost}#/employeeView/${mRowData.Pernr}/${sUsrty}`, '_blank', 'width=1400,height=800');
      },

      async onPressEmployee2Row(oEvent) {
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();
        const sDiscod = this.getViewModel().getProperty('/dialog/param/Discod');
        const sAwart = _.includes(['3', '4'], sDiscod) ? '2010' : '2000';

        this.openDialog({ ..._.pick(mRowData, ['Pernr', 'Begda', 'Endda']), Headty: 'X2', Awart: sAwart });
      },

      async onPressEmployee3Row(oEvent) {
        const mRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        this.openDialog({ ..._.pick(mRowData, ['Pernr', 'Begda', 'Endda']), Headty: 'X1' });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
