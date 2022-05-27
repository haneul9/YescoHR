sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/GroupDialogHandler',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    GroupDialogHandler,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.leaveSummary.App', {
      TABLE_ID: 'leaveSummaryTable',

      CHART_ID: 'leaveSummaryChart',

      GroupDialogHandler: null,

      AWART_COUNT: { 2000: 1, 2010: 1, 2001: 0.5, 2002: 0.5 },

      sRouteName: '',

      initializeModel() {
        return {
          busy: false,
          search: {
            Plnyy: moment().format('YYYY'),
            Seqno: '',
            Orgeh: '',
            Orgtx: '',
          },
          entry: {
            YearList: [],
            SeqnoList: [],
          },
          summary: {
            infoText: this.getBundleText('LABEL_23012', '2021.01.01~2021.12.31'),
            dataSources: {
              chart: FusionCharts.curryChartOptions({
                pieRadius: '90%',
                showLegend: 0,
                showValues: 0,
                showLabels: 0,
                showPercentInTooltip: 0,
                showToolTipShadow: 0,
                slicingDistance: 5,
                formatNumber: 1,
                formatNumberScale: false,
                decimals: 1,
                useDataPlotColorForLabels: 1,
                paletteColors: '#5e696e,#ffc02e,#007BFF,#FD5F58',
              }),
              data: [
                {
                  label: this.getBundleText('LABEL_23013'), // 미입력
                  value: '0',
                  isSliced: '1',
                },
                {
                  label: this.getBundleText('LABEL_00121'), // 신청
                  value: '0',
                  isSliced: '0',
                },
                {
                  label: this.getBundleText('LABEL_00123'), // 승인
                  value: '0',
                  isSliced: '0',
                },
                {
                  label: this.getBundleText('LABEL_00124'), // 반려
                  value: '0',
                  isSliced: '0',
                },
              ],
            },
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            ObjTxt1: this.getBundleText('LABEL_23013'), // 미입력
            ObjTxt5: this.getBundleText('LABEL_00123'), // 승인
            isShowProgress: true,
            progressCount: 0,
            isShowApply: true,
            applyCount: 0,
            isShowApprove: false,
            approveCount: 0,
            isShowReject: true,
            rejectCount: 0,
            isShowComplete: true,
            completeCount: 0,
            infoMessage: this.getBundleText('LABEL_23010', '2021.01.01~2021.12.31'),
          },
          list: [],
          plans: {
            Plnyy: '',
            Seqno: '',
            selectedDay: '',
            count: {},
            raw: [],
            grid: [],
          },
        };
      },

      onBeforeShow() {
        this.GroupDialogHandler = new GroupDialogHandler(this, ([mOrgData]) => {
          const oViewModel = this.getViewModel();

          oViewModel.setProperty('/search/Orgeh', _.isEmpty(mOrgData) ? null : mOrgData.Orgeh);
          oViewModel.setProperty('/search/Orgtx', _.isEmpty(mOrgData) ? '' : mOrgData.Stext);
        });

        this.TableUtils.adjustRowSpan({
          oTable: this.byId(this.TABLE_ID),
          aColIndices: [0, 1, 2, 3, 4, 15],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oViewModel = this.getViewModel();

        this.sRouteName = sRouteName;
        oViewModel.setSizeLimit(500);
        oViewModel.setData(this.initializeModel());

        this.getAppointeeModel().setProperty('/showChangeButton', false);

        try {
          oViewModel.setProperty('/busy', true);

          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          const sWerks = this.getAppointeeProperty('Werks');

          const aPlanYear = await fCurried('HolPlanYear', { Werks: sWerks });
          const aPlanSeqnr = await fCurried('HolPlanSeqnr', { Werks: sWerks, Plnyy: _.get(aPlanYear, [0, 'Plnyy'], _.noop()) });

          const mSearch = oViewModel.getProperty('/search');
          _.chain(mSearch)
            .set('Plnyy', _.get(aPlanYear, [0, 'Plnyy'], 'ALL'))
            .set('Seqno', _.chain(aPlanSeqnr).find({ Curyn: 'X' }).get('Seqno', 'ALL').value())
            .set('Orgeh', this.getAppointeeProperty('Orgeh'))
            .set('Orgtx', this.getAppointeeProperty('Orgtx'))
            .commit();

          const mEntry = oViewModel.getProperty('/entry');
          _.chain(mEntry)
            .set('YearList', new ComboEntry({ codeKey: 'Plnyy', valueKey: 'Plnyy', aEntries: aPlanYear }) ?? [])
            .set('SeqnoList', new ComboEntry({ codeKey: 'Seqno', valueKey: 'Seqno', aEntries: aPlanSeqnr }) ?? [])
            .commit();

          await this.onPressSearch();
        } catch (oError) {
          this.debug('Controller > leaveSummary App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async setHolPlanSeqno() {
        const oViewModel = this.getViewModel();
        const sPlnyy = oViewModel.getProperty('/search/Plnyy');

        if (_.isEqual(sPlnyy, 'ALL')) return;

        const aSeqno = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'HolPlanSeqnr', {
          Werks: this.getAppointeeProperty('Werks'),
          Plnyy: sPlnyy,
        });

        oViewModel.setProperty('/search/Seqno', _.chain(aSeqno).find({ Curyn: 'X' }).get('Seqno', 'ALL').value());
        oViewModel.setProperty('/entry/SeqnoList', new ComboEntry({ codeKey: 'Seqno', valueKey: 'Seqno', aEntries: aPlanSeqnr }) ?? []);
      },

      buildChart() {
        const oChart = FusionCharts(`${this.sRouteName}-${this.CHART_ID}`);
        const mDataSource = this.getViewModel().getProperty('/summary/dataSources');

        if (!oChart) {
          FusionCharts.ready(() => {
            FusionCharts.getInstance({
              id: `${this.sRouteName}-${this.CHART_ID}`,
              type: 'pie2d',
              renderAt: `chart-${this.sRouteName}-container`,
              width: 180,
              height: 160,
              dataFormat: 'json',
              dataSource: mDataSource,
            }).render();
          });
        } else {
          oChart.setChartData(mDataSource);
          oChart.render();
        }
      },

      getBoxObject({ day = 'NONE', label = '', classNames = '', awart = '' }) {
        return { day, label, classNames, awart };
      },

      getPlanHeader() {
        return [
          this.getBoxObject({ label: this.getBundleText('LABEL_00253'), classNames: 'Header' }), //  월
          this.getBoxObject({ label: this.getBundleText('LABEL_20010'), classNames: 'Header' }), // 개수
          ..._.times(31, (n) => this.getBoxObject({ label: n + 1, classNames: 'Header' })),
        ];
      },

      getPlanBody(iMonth) {
        const oViewModel = this.getViewModel();
        const mCount = oViewModel.getProperty('/plans/count');
        const mPlansRawData = oViewModel.getProperty('/plans/raw');
        const sYear = oViewModel.getProperty('/plans/Plnyy');
        const sYearMonth = `${sYear}-${_.padStart(iMonth + 1, 2, '0')}`;

        _.set(mCount, iMonth + 1, 0);

        return [
          this.getBoxObject({ label: this.getBundleText('LABEL_20011', iMonth + 1), classNames: 'Header' }), //  {0}월
          this.getBoxObject({ day: `Count-${iMonth + 1}`, label: 0, classNames: 'Header' }),
          ..._.times(31, (n) => {
            const sDay = `${sYearMonth}-${_.padStart(n + 1, 2, '0')}`;
            return this.getBoxObject({ day: sDay, label: '', classNames: this.getDayStyle(mPlansRawData, sDay), awart: _.get(mPlansRawData, [sDay, 'Awart'], '') });
          }),
        ];
      },

      getDayStyle(mPlansRawData, sDay) {
        const sHolyn = _.get(mPlansRawData, [sDay, 'Holyn']);
        const sInpyn = _.get(mPlansRawData, [sDay, 'Inpyn']);
        const mClasses = {
          Weekend: { sHolyn: 'X', sInpyn: '' },
          Disable: { sHolyn: '', sInpyn: '' },
          Normal: { sHolyn: '', sInpyn: 'X' },
        };

        return moment(sDay).isValid() ? _.chain(mClasses).findKey({ sHolyn, sInpyn }).value() : 'None';
      },

      async buildPlanGrid({ Pernr, Plnyy, Seqno }) {
        const oViewModel = this.getViewModel();
        const aAnnualLeavePlan = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'AnnualLeavePlan', {
          Menid: this.getCurrentMenuId(),
          Pernr,
          Plnyy,
          Seqno,
        });

        oViewModel.setProperty('/plans/Plnyy', Plnyy);
        oViewModel.setProperty('/plans/Seqno', Seqno);
        oViewModel.setProperty(
          '/plans/raw',
          _.chain(aAnnualLeavePlan)
            .groupBy((o) => moment(o.Tmdat).format('YYYY-MM-DD'))
            .forOwn((v, p, obj) => (obj[p] = _.omit(v[0], '__metadata')))
            .value()
        );
        oViewModel.setProperty('/plans/grid', [
          ...this.getPlanHeader(), //
          ..._.times(12, (n) => this.getPlanBody(n)).reduce((a, b) => [...a, ...b], []),
        ]);
        oViewModel.setProperty('/plans/raw', []);

        const aGridPlans = oViewModel.getProperty('/plans/grid');
        const aGridCounts = aGridPlans.filter((o) => _.startsWith(o.day, 'Count'));
        const mGroupByMonth = _.chain(aGridPlans)
          .reject({ awart: '' })
          .groupBy((o) => _.chain(o.day).split('-', '2').last().toNumber().value())
          .map((v, p) => ({ [p]: _.sumBy(v, (obj) => this.AWART_COUNT[obj.awart]) }))
          .reduce((a, c) => ({ ...a, ...c }), {})
          .value();
        const mCount = oViewModel.getProperty('/plans/count');
        _.chain(mCount)
          .forOwn((v, p, obj) => _.set(obj, p, 0))
          .assign(mGroupByMonth)
          .forOwn((v, p) => _.set(aGridCounts, [p - 1, 'label'], v))
          .commit();
        const mGroupByAwart = _.chain(aGridPlans)
          .reject({ awart: '' })
          .groupBy('awart')
          .map((v, p) => ({ [p]: _.sumBy(v, (obj) => this.AWART_COUNT[obj.awart]) }))
          .reduce((a, c) => ({ ...a, ...c }), {})
          .value();
        const iYearOffCount = _.chain(mGroupByAwart)
          .omit('2010')
          .reduce((acc, cur) => (acc += cur), 0)
          .value();
        const iSummerOffCount = _.get(mGroupByAwart, '2010', 0);

        oViewModel.setProperty('/plans/planTxt', this.getBundleText('LABEL_23017', iYearOffCount, iSummerOffCount));
      },

      async openPlanDialog() {
        const oView = this.getView();

        if (!this._oPlanDialog) {
          this._oPlanDialog = await Fragment.load({
            id: oView.getId(),
            name: 'sap.ui.yesco.mvc.view.leaveSummary.fragment.PlanDialog',
            controller: this,
          });

          this._oPlanDialog.attachBeforeOpen(() => {
            this.getViewModel().setProperty('/plans/count', {});
            this.getViewModel().setProperty('/plans/grid', []);
          });

          oView.addDependent(this._oPlanDialog);
        }

        this._oPlanDialog.open();
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onPressSearchOrgeh(oEvent) {
        const bClearPressed = oEvent.getParameter('clearButtonPressed');

        if (bClearPressed) {
          this.getViewModel().setProperty('/search/Orgeh', '');
        } else {
          this.GroupDialogHandler.openDialog();
        }
      },

      async onFileView(oEvent) {
        const mCustomData = oEvent.getSource().data();
        const mPlanData = await Client.get(this.getModel(ServiceNames.WORKTIME), 'HolPlanList', mCustomData);

        window.open(mPlanData.Pdfurl, '_blank');
      },

      onChangePlnyy() {
        this.setHolPlanSeqno();
      },

      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mSearch = oViewModel.getProperty('/search');
          const sWerks = this.getAppointeeProperty('Werks');
          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          const mFilter = { Werks: sWerks, ..._.omit(mSearch, 'Orgtx') };

          const [[mSummary], aPlanList] = await Promise.all([
            fCurried('HolPlanSummary', mFilter), //
            fCurried('HolPlanList', mFilter),
          ]);

          const oTable = this.byId(this.TABLE_ID);
          const oListInfo = oViewModel.getProperty('/listInfo');

          oViewModel.setProperty(
            '/list',
            _.map(aPlanList, (o) => _.omit(o, '__metadata'))
          );
          oViewModel.setProperty('/listInfo', {
            ...oListInfo,
            infoMessage: this.getBundleText('LABEL_23010', _.get(mSummary, 'Tmprd')),
            ...this.TableUtils.count({ oTable, aRowData: aPlanList }),
          });

          const mViewSummary = oViewModel.getProperty('/summary');
          _.chain(mViewSummary)
            .set('infoText', this.getBundleText('LABEL_23012', _.get(mSummary, 'Tmprd')))
            .set(['dataSources', 'data', 0, 'value'], _.get(mSummary, 'Cnt01', 0))
            .set(['dataSources', 'data', 1, 'value'], _.get(mSummary, 'Cnt03', 0))
            .set(['dataSources', 'data', 2, 'value'], _.get(mSummary, 'Cnt04', 0))
            .set(['dataSources', 'data', 3, 'value'], _.get(mSummary, 'Cnt05', 0))
            .assign(_.pickBy(mSummary, (v, p) => _.startsWith(p, 'Cnt')))
            .commit();

          this.buildChart();
        } catch (oError) {
          this.debug('Controller > leaveSummary App > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = this.getViewModel().getProperty(sPath);

        oViewModel.setProperty('/plans/busy', true);
        oViewModel.setProperty('/plans/headerTxt', this.getBundleText('LABEL_23016', oRowData.Orgtx, oRowData.Ename, oRowData.Zzjikgbt, _.toNumber(oRowData.Pernr), oRowData.Plnyy, oRowData.Seqno));

        await this.openPlanDialog();
        await this.buildPlanGrid(oRowData);

        oViewModel.setProperty('/plans/busy', false);
      },

      onPressClosePlanDialog() {
        this._oPlanDialog.close();
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_23015'); // {연간휴가계획현황}_목록

        this.TableUtils.export({ oTable, sFileName });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
