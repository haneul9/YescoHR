sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Decimal',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    AppUtils,
    Client,
    ServiceNames,
    UI5Error,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.leave.App', {
      TableUtils: TableUtils,
      TABLE_ID: 'leaveTable',
      CHART_LEAVE_ID: 'LeaveMonthlyChart',
      PERSONAL_DIALOG_ID: 'sap.ui.yesco.mvc.view.leave.fragment.PersonalDialog',
      PERSONAL_TABLE_ID: 'leaveByPersonalTable',

      CHARTS: {
        ACC: { color: '#dc3545', label: 'LABEL_16018', prop: 'Cumuse', propPerc: 'Cumrte' },
        CUR: { color: '#2972c8', label: 'LABEL_16020', prop: 'Monuse', propPerc: 'Monrte' },
      },

      initializeModel() {
        return {
          busy: false,
          search: {
            Zyymm: moment().format('YYYYMM'),
            Orgeh: '',
            Qtaty: '',
          },
          entry: {
            department: [],
            leaveType: [],
          },
          summary: {
            chart: {
              showSum: 1,
              showValues: 1,
              rotateValues: 0,
              placeValuesInside: 0,
              divLineDashed: 0,
              divLineColor: '#eeeeee',
              maxColWidth: 25,
              staggerLines: '2',
              theme: 'ocean',
              bgColor: 'transparent',
              baseFontSize: '14',
              valueFontSize: '14',
              legendItemFontSize: '14',
              valueFontColor: '#000000',
              valueBgColor: 'transparent',
              showPlotBorder: 0,
              plotBorderThickness: 3,
              plotBorderColor: '#ffffff',
              drawCustomLegendIcon: 1,
              legendIconSides: 0,
              chartTopMargin: 4,
              chartRightMargin: 0,
              chartBottomMargin: 0,
              chartLeftMargin: 2,
              toolTipBgColor: '#ffffff',
              toolTipColor: '#222222',
              showToolTipShadow: 1,
              plotcolorintooltip: 1,
              plottooltext: "<div class='fusion-tooltip'><table><tr><th>$seriesname-$label</th><td>$value</td></tr></table></div>",
            },
            categories: [{ category: [] }],
            dataset: [],
          },
          listInfo: {
            rowCount: 2,
          },
          list: [],
          dialog: {
            busy: false,
            title: '',
            rowCount: 1,
            list: [],
          },
        };
      },

      onBeforeShow() {
        TableUtils.adjustRowSpan({
          oTable: this.byId(this.TABLE_ID),
          aColIndices: [0, 1],
          sTheadOrTbody: 'thead',
        });
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          oViewModel.setProperty('/busy', true);

          const [aDepartment, aLeaveType] = await Promise.all([
            Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'MssOrgehList', { Pernr: this.getAppointeeProperty('Pernr') }),
            Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'QtatyCodeList'), //
          ]);

          oViewModel.setProperty('/entry/department', aDepartment ?? []);
          oViewModel.setProperty('/entry/leaveType', aLeaveType ?? []);

          const sOrgeh = _.get(aDepartment, [0, 'Orgeh'], _.noop());
          const sQtaty = _.get(aLeaveType, [0, 'Zcode'], _.noop());

          oViewModel.setProperty('/search/Orgeh', sOrgeh);
          oViewModel.setProperty('/search/Qtaty', sQtaty);

          if (!_.isEmpty(sOrgeh) && !_.isEmpty(sQtaty)) this.onPressSearch();
        } catch (oError) {
          this.debug('Controller > leave App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setTableData({ oViewModel, aRowData }) {
        aRowData = [
          {
            Zyymm: '202204',
            Orgeh: '11000004',
            Orgtx: '안전기술부문',
            Qtaty: '1',
            Empcnt: '1',
            Inw01: '0.0',
            Inw02: '0.0',
            Inw03: '0.0',
            Inw04: '0.0',
            Inw05: '0.0',
            Inw06: '0.0',
            Inw07: '0.0',
            Inw08: '0.0',
            Inw09: '0.0',
            Inw10: '0.0',
            Inw11: '0.0',
            Inw12: '0.0',
            Zsort: '21',
            Tlevel: 2,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000009',
            Orgtx: '노경지원팀',
            Qtaty: '1',
            Empcnt: '12',
            Inw01: '3.8',
            Inw02: '4.9',
            Inw03: '0.0',
            Inw04: '7.5',
            Inw05: '2.8',
            Inw06: '4.9',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '9',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000010',
            Orgtx: '인재개발팀',
            Qtaty: '1',
            Empcnt: '7',
            Inw01: '7.1',
            Inw02: '2.6',
            Inw03: '6.3',
            Inw04: '0.0',
            Inw05: '0.0',
            Inw06: '4.3',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '0.0',
            Inw11: '0.0',
            Inw12: '100.0',
            Zsort: '8',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000012',
            Orgtx: '노경지원 O/H',
            Qtaty: '1',
            Empcnt: '2',
            Inw01: '0.0',
            Inw02: '11.5',
            Inw03: '0.0',
            Inw04: '0.0',
            Inw05: '0.0',
            Inw06: '11.5',
            Inw07: '0.0',
            Inw08: '100.0',
            Inw09: '0.0',
            Inw10: '0.0',
            Inw11: '0.0',
            Inw12: '100.0',
            Zsort: '12',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000013',
            Orgtx: '정보기술팀',
            Qtaty: '1',
            Empcnt: '5',
            Inw01: '0.0',
            Inw02: '10.6',
            Inw03: '5.0',
            Inw04: '2.6',
            Inw05: '0.0',
            Inw06: '6.8',
            Inw07: '0.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '0.0',
            Inw12: '100.0',
            Zsort: '10',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000014',
            Orgtx: '경영진단팀',
            Qtaty: '1',
            Empcnt: '3',
            Inw01: '8.7',
            Inw02: '2.0',
            Inw03: '11.4',
            Inw04: '0.0',
            Inw05: '0.0',
            Inw06: '7.1',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '0.0',
            Inw11: '0.0',
            Inw12: '100.0',
            Zsort: '2',
            Tlevel: 2,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000015',
            Orgtx: '재경팀',
            Qtaty: '1',
            Empcnt: '9',
            Inw01: '0.0',
            Inw02: '7.4',
            Inw03: '6.0',
            Inw04: '10.5',
            Inw05: '0.0',
            Inw06: '5.9',
            Inw07: '0.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '5',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000016',
            Orgtx: '경영기획팀',
            Qtaty: '1',
            Empcnt: '6',
            Inw01: '3.8',
            Inw02: '0.0',
            Inw03: '7.1',
            Inw04: '5.6',
            Inw05: '0.0',
            Inw06: '6.1',
            Inw07: '100.0',
            Inw08: '0.0',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '0.0',
            Inw12: '100.0',
            Zsort: '4',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000017',
            Orgtx: '사업기획팀',
            Qtaty: '1',
            Empcnt: '6',
            Inw01: '4.0',
            Inw02: '2.1',
            Inw03: '0.0',
            Inw04: '5.3',
            Inw05: '0.0',
            Inw06: '2.6',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '0.0',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '6',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000018',
            Orgtx: '영업관리팀',
            Qtaty: '1',
            Empcnt: '12',
            Inw01: '7.7',
            Inw02: '10.8',
            Inw03: '6.0',
            Inw04: '4.2',
            Inw05: '5.0',
            Inw06: '8.6',
            Inw07: '100.0',
            Inw08: '99.7',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '99.8',
            Zsort: '28',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000019',
            Orgtx: '요금팀',
            Qtaty: '1',
            Empcnt: '8',
            Inw01: '8.0',
            Inw02: '6.9',
            Inw03: '8.3',
            Inw04: '10.5',
            Inw05: '6.7',
            Inw06: '8.2',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '29',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000020',
            Orgtx: '채권관리팀',
            Qtaty: '1',
            Empcnt: '8',
            Inw01: '4.0',
            Inw02: '8.7',
            Inw03: '4.0',
            Inw04: '0.0',
            Inw05: '0.0',
            Inw06: '5.6',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '0.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '30',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000021',
            Orgtx: '계량기술팀',
            Qtaty: '1',
            Empcnt: '8',
            Inw01: '0.0',
            Inw02: '6.0',
            Inw03: '3.8',
            Inw04: '0.0',
            Inw05: '0.0',
            Inw06: '4.4',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '0.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '33',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000022',
            Orgtx: '공사안전팀',
            Qtaty: '1',
            Empcnt: '15',
            Inw01: '14.8',
            Inw02: '6.3',
            Inw03: '6.1',
            Inw04: '6.7',
            Inw05: '1.7',
            Inw06: '6.6',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '25',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000023',
            Orgtx: '경기북부안전팀',
            Qtaty: '1',
            Empcnt: '20',
            Inw01: '8.2',
            Inw02: '5.8',
            Inw03: '7.4',
            Inw04: '0.0',
            Inw05: '8.3',
            Inw06: '7.2',
            Inw07: '97.3',
            Inw08: '96.4',
            Inw09: '99.7',
            Inw10: '0.0',
            Inw11: '100.0',
            Inw12: '98.7',
            Zsort: '19',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000024',
            Orgtx: '경기남부안전팀',
            Qtaty: '1',
            Empcnt: '19',
            Inw01: '7.1',
            Inw02: '7.4',
            Inw03: '5.3',
            Inw04: '0.0',
            Inw05: '8.5',
            Inw06: '6.0',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '98.6',
            Inw10: '95.8',
            Inw11: '100.0',
            Inw12: '99.0',
            Zsort: '20',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000025',
            Orgtx: '경기영업관리팀',
            Qtaty: '1',
            Empcnt: '15',
            Inw01: '8.9',
            Inw02: '4.9',
            Inw03: '3.0',
            Inw04: '8.3',
            Inw05: '0.0',
            Inw06: '5.6',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '0.0',
            Inw12: '100.0',
            Zsort: '31',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000026',
            Orgtx: '안전관리실',
            Qtaty: '1',
            Empcnt: '14',
            Inw01: '7.7',
            Inw02: '8.5',
            Inw03: '9.2',
            Inw04: '0.0',
            Inw05: '9.1',
            Inw06: '8.8',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '0.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '14',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000027',
            Orgtx: '동부안전팀',
            Qtaty: '1',
            Empcnt: '20',
            Inw01: '0.0',
            Inw02: '3.7',
            Inw03: '5.7',
            Inw04: '8.7',
            Inw05: '10.0',
            Inw06: '5.9',
            Inw07: '0.0',
            Inw08: '98.8',
            Inw09: '96.7',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '98.1',
            Zsort: '15',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000028',
            Orgtx: '서부안전팀',
            Qtaty: '1',
            Empcnt: '14',
            Inw01: '3.7',
            Inw02: '9.7',
            Inw03: '1.0',
            Inw04: '4.0',
            Inw05: '2.1',
            Inw06: '4.6',
            Inw07: '100.0',
            Inw08: '96.3',
            Inw09: '98.6',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '98.4',
            Zsort: '17',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000029',
            Orgtx: '중부안전팀',
            Qtaty: '1',
            Empcnt: '20',
            Inw01: '10.3',
            Inw02: '8.8',
            Inw03: '4.0',
            Inw04: '9.7',
            Inw05: '7.6',
            Inw06: '6.7',
            Inw07: '93.1',
            Inw08: '99.3',
            Inw09: '98.8',
            Inw10: '100.0',
            Inw11: '98.6',
            Inw12: '98.7',
            Zsort: '18',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000030',
            Orgtx: '안전진단팀',
            Qtaty: '1',
            Empcnt: '17',
            Inw01: '7.4',
            Inw02: '6.3',
            Inw03: '7.0',
            Inw04: '5.3',
            Inw05: '12.7',
            Inw06: '7.6',
            Inw07: '100.0',
            Inw08: '99.6',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '99.9',
            Zsort: '23',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000031',
            Orgtx: 'CS팀',
            Qtaty: '1',
            Empcnt: '16',
            Inw01: '7.4',
            Inw02: '6.5',
            Inw03: '6.6',
            Inw04: '21.3',
            Inw05: '13.3',
            Inw06: '9.3',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '27',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000032',
            Orgtx: '북부안전팀',
            Qtaty: '1',
            Empcnt: '16',
            Inw01: '7.4',
            Inw02: '4.6',
            Inw03: '3.8',
            Inw04: '6.3',
            Inw05: '2.1',
            Inw06: '4.2',
            Inw07: '100.0',
            Inw08: '97.2',
            Inw09: '98.9',
            Inw10: '100.0',
            Inw11: '97.9',
            Inw12: '98.5',
            Zsort: '16',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000033',
            Orgtx: '안전공급기술팀',
            Qtaty: '1',
            Empcnt: '10',
            Inw01: '0.0',
            Inw02: '2.5',
            Inw03: '2.5',
            Inw04: '13.9',
            Inw05: '4.2',
            Inw06: '3.3',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '100.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '22',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000034',
            Orgtx: '배관연구팀',
            Qtaty: '1',
            Empcnt: '9',
            Inw01: '7.4',
            Inw02: '10.3',
            Inw03: '8.5',
            Inw04: '0.0',
            Inw05: '3.1',
            Inw06: '9.0',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '100.0',
            Inw10: '0.0',
            Inw11: '100.0',
            Inw12: '100.0',
            Zsort: '24',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000035',
            Orgtx: '에너지사업팀',
            Qtaty: '1',
            Empcnt: '6',
            Inw01: '4.0',
            Inw02: '8.2',
            Inw03: '0.0',
            Inw04: '5.3',
            Inw05: '0.0',
            Inw06: '7.0',
            Inw07: '100.0',
            Inw08: '100.0',
            Inw09: '0.0',
            Inw10: '100.0',
            Inw11: '0.0',
            Inw12: '100.0',
            Zsort: '34',
            Tlevel: 3,
            Werks: '',
          },
          {
            Zyymm: '202204',
            Orgeh: '11000040',
            Orgtx: '에너지기술부문',
            Qtaty: '1',
            Empcnt: '1',
            Inw01: '0.0',
            Inw02: '0.0',
            Inw03: '0.0',
            Inw04: '0.0',
            Inw05: '0.0',
            Inw06: '0.0',
            Inw07: '0.0',
            Inw08: '0.0',
            Inw09: '0.0',
            Inw10: '0.0',
            Inw11: '0.0',
            Inw12: '0.0',
            Zsort: '32',
            Tlevel: 2,
            Werks: '',
          },
        ];

        const oTable = this.byId(this.TABLE_ID);
        const sSumLabel = this.getBundleText('LABEL_00172'); // 합계
        const mSumRow = TableUtils.generateSumRow({
          aTableData: aRowData,
          mSumField: { Orgtx: sSumLabel },
          vCalcProps: ['Empcnt', ..._.times(12, (i) => `Inw${_.padStart(i + 1, 2, '0')}`)],
        });

        const iTotalLength = aRowData.length;
        oViewModel.setProperty(
          '/list',
          _.isEmpty(mSumRow)
            ? []
            : [
                ...aRowData,
                _.forEach(mSumRow, (v, p) => {
                  if (_.startsWith(p, 'Inw')) {
                    _.set(mSumRow, p, _.chain(v).divide(iTotalLength).floor(2).value());
                  }
                }),
              ]
        );
        oViewModel.setProperty('/listInfo/rowCount', aRowData.length + 1);

        setTimeout(() => {
          TableUtils.setColorColumn({ oTable, bHasSumRow: true, mColorMap: { 7: 'bgType02', 13: 'bgType02' } });
        }, 100);
      },

      openPersonalDialog() {
        const oView = this.getView();

        if (!this.pPersonalDialog) {
          this.pPersonalDialog = Fragment.load({
            id: oView.getId(),
            name: this.PERSONAL_DIALOG_ID,
            controller: this,
          }).then((oDialog) => {
            oView.addDependent(oDialog);

            TableUtils.adjustRowSpan({
              oTable: this.byId(this.PERSONAL_TABLE_ID),
              aColIndices: [0, 1, 2, 3, 4, 5, 6, 11],
              sTheadOrTbody: 'thead',
            });

            return oDialog;
          });
        }
        this.pPersonalDialog.then((oDialog) => oDialog.open());
      },

      buildChart() {
        const oChart = FusionCharts(this.CHART_LEAVE_ID);
        const mDataSource = this.getViewModel().getProperty('/summary');

        if (!oChart) {
          FusionCharts.ready(() => {
            new FusionCharts({
              id: this.CHART_LEAVE_ID,
              type: 'mscombi2d',
              renderAt: 'chart-leave-container',
              width: '100%',
              height: '100%',
              dataFormat: 'json',
              dataSource: mDataSource,
            }).render();
          });
        } else {
          oChart.setChartData(mDataSource);
          oChart.render();
        }
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const mFilters = oViewModel.getProperty('/search');
          const fCurried = Client.getEntitySet(this.getModel(ServiceNames.WORKTIME));
          const [aSummary, aRowData] = await Promise.all([
            fCurried('LeaveUseHistory', { ...mFilters }), //
            fCurried('LeaveUseBoard', { ...mFilters }),
          ]);

          this.setTableData({ oViewModel, aRowData });

          const mGroupByOyymm = _.chain(aSummary)
            .groupBy('Oyymm')
            .defaults({ ..._.times(12, (v) => ({ [`${this.getBundleText('LABEL_16019', v + 1)}`]: [{ [this.CHARTS.ACC.prop]: 0, [this.CHARTS.CUR.prop]: 0 }] })).reduce((acc, cur) => ({ ...acc, ...cur }), {}) })
            .value();

          const iCurrentMonthIndex = moment(mFilters.Zyymm).month() + 1;
          const mVerticalLineMonth = {
            vline: 'true',
            lineposition: '0',
            color: '#6baa01',
            labelHAlign: 'center',
            labelPosition: '0',
            // label: 'Selected Month',
            dashed: '1',
          };

          oViewModel.setProperty(
            '/summary/categories/0/category',
            _.chain(aSummary)
              .reduce((acc, cur) => [...acc, { label: cur.Oyymm }], [])
              .defaults(_.times(12, (v) => ({ label: this.getBundleText('LABEL_16019', v + 1) })))
              .tap((arr) => arr.splice(iCurrentMonthIndex, 0, mVerticalLineMonth))
              .value()
          );
          oViewModel.setProperty('/summary/dataset', [
            {
              seriesname: this.getBundleText(this.CHARTS.CUR.label),
              showValues: '1',
              color: '#7BB4EB',
              data: _.map(mGroupByOyymm, (v) => ({ value: _.get(v, [0, this.CHARTS.CUR.propPerc], 0) })),
            },
            {
              seriesname: this.getBundleText(this.CHARTS.ACC.label),
              renderAs: 'line',
              color: '#FFAC4B',
              data: _.chain(mGroupByOyymm)
                .map((v) => ({ value: _.get(v, [0, this.CHARTS.ACC.propPerc]) }))
                .forEach((v, i, o) => {
                  if (_.isEqual(v.value, 0)) v.value = _.get(o, [i - 1, 'value'], 0);
                })
                .value(),
            },
          ]);

          this.buildChart();
        } catch (oError) {
          this.debug('Controller > leave App > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onPressPersonalDialogClose() {
        this.pPersonalDialog.then((oDialog) => oDialog.close());
      },

      async onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const oControl = oEvent.getSource();
        const mControlParam = oEvent.getParameters();
        const sFldcd = oControl.getColumns()[mControlParam.columnIndex].data('field');
        const mRowData = oControl.getRows()[mControlParam.rowIndex].getBindingContext().getObject();

        if (mRowData.Sumrow || _.isEmpty(sFldcd)) return;

        try {
          oViewModel.setProperty('/dialog/busy', true);

          const aDetailRow = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'LeaveUseDetail', {
            ..._.pick(mRowData, ['Zyymm', 'Orgeh', 'Qtaty']),
            Fldcd: sFldcd,
          });

          if (_.isEmpty(aDetailRow)) throw new UI5Error({ message: this.getBundleText('MSG_00043') }); // 조회할 수 없습니다.

          const aLeaveType = oViewModel.getProperty('/entry/leaveType');

          oViewModel.setProperty('/dialog/title', _.find(aLeaveType, { Zcode: mRowData.Qtaty }).Ztext ?? '');
          oViewModel.setProperty('/dialog/rowCount', Math.min(6, aDetailRow.length || 1));
          oViewModel.setProperty(
            '/dialog/list',
            _.map(aDetailRow, (o, i) => ({ Idx: i + 1, ...o }))
          );

          this.openPersonalDialog();
        } catch (oError) {
          this.debug('Controller > leave App > onSelectRow Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/dialog/busy', false);
        }
      },

      onPressExcelDownload() {
        const oTable = this.byId('leaveTable');
        const aTableData = this.getViewModel().getProperty('/list');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_16021'); // {휴가부서별현황}_목록

        TableUtils.export({ oTable, aTableData, sFileName, bHasMultiLabel: true });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
