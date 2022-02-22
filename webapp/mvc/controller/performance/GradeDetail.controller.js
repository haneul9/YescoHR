sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    UI5Error,
    TableUtils,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.GradeDetail', {
      initializeModel() {
        return {
          busy: false,
          grade: [],
          summary: {
            ZzapstsNm: '2차평가중',
            Orgtx2: '경영지원부문',
            ZzappgrTxt: '과장이상',
            list: [],
          },
          department: {
            rowCount: 2,
            list: [],
          },
          raw: {
            rowCount: 0,
            list: [],
          },
        };
      },

      /**
       * @override
       */
      onBeforeShow() {
        TableUtils.adjustRowSpan({
          oTable: this.byId('departmentTable'),
          aColIndices: [0],
          sTheadOrTbody: 'thead',
        });
      },

      /**
       * @override
       */
      onAfterShow() {
        BaseController.prototype.onAfterShow.apply(this, arguments);

        setTimeout(() => {
          TableUtils.setColorColumn({
            oTable: this.byId('summaryTable'),
            bIncludeHeader: true,
            mHeaderColorMap: { 2: 'bgType04', 3: 'bgType05', 4: 'bgType06' },
            mColorMap: { 2: 'bgType07', 3: 'bgType08', 4: 'bgType09' },
          });
        }, 100);
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          const oView = this.getView();
          const oListView = oView.getParent().getPage('container-ehr---m_performanceGrade');

          if (_.isEmpty(oListView) || _.isEmpty(oListView.getModel().getProperty('/parameter/rowData'))) {
            throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          const mParameter = _.chain(oListView.getModel().getProperty('/parameter/rowData')).cloneDeep().omit('__metadata').value();
          const mDetailData = await Client.deep(this.getModel(ServiceNames.APPRAISAL), 'Appraisal2GDoc', {
            Menid: this.getCurrentMenuId(),
            Prcty: Constants.PROCESS_TYPE.DETAIL.code,
            ..._.pick(mParameter, ['Orgeh2', 'Zapcnt', 'Zzappgr', 'Zzapper', 'Zzappid', 'Zzapsts', 'ZzapstsSub', 'ZzapstsPSub']),
            Appraisal2GDocDetSet: [],
            Appraisal2GGradeSet: [],
          });

          const aGradeRatings = _.chain(mDetailData.Appraisal2GGradeSet.results)
            .head()
            .pickBy((v, p) => _.startsWith(p, 'Rating') && !_.isEqual(v, '0000'))
            .map((v) => ({ code: v }))
            .value();
          const aGradeErrorLevels = _.chain(mDetailData.Appraisal2GGradeSet.results)
            .nth(2)
            .pickBy((v, p) => _.startsWith(p, 'Zgrade') && !_.isEmpty(v))
            .map((v) => ({ level: v }))
            .value();
          const aGrades = _.chain(mDetailData.Appraisal2GGradeSet.results)
            .head()
            .pickBy((v, p) => _.startsWith(p, 'Zgrade') && !_.isEmpty(v))
            .map((v) => ({ text: v }))
            .map((obj, idx) => ({ ...obj, ..._.get(aGradeRatings, [idx]), ..._.get(aGradeErrorLevels, [idx]) }))
            .value();

          oViewModel.setProperty('/grade', aGrades);

          oViewModel.setProperty('/summary/list', [
            _.chain(mDetailData.Appraisal2GGradeSet.results)
              .nth(1)
              .pickBy((v, p) => (_.startsWith(p, 'Zgrade') && !_.isEmpty(v)) || _.isEqual(p, 'Ztotcnt'))
              .forEach((v, p, o) => {
                o[p] = _.trim(v);
              })
              .set('Label', this.getBundleText('LABEL_10076'))
              .value(),
            { Label: this.getBundleText('LABEL_10077'), Ztotcnt: '0', Zgrade1: '0', Zgrade2: '0', Zgrade3: '0' },
          ]);

          oViewModel.setProperty('/raw/rowCount', Math.min(_.size(mDetailData.Appraisal2GDocDetSet.results), 10));
          oViewModel.setProperty(
            '/raw/list',
            _.map(mDetailData.Appraisal2GDocDetSet.results, (o) => _.omit(o, '__metadata'))
          );

          this.calculateByDepart();
        } catch (oError) {
          this.debug(`Controller > m/performanceGrade Grade > onObjectMatched Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      calculateByDepart() {
        const oViewModel = this.getViewModel();
        const aGrades = oViewModel.getProperty('/grade');
        const aRawList = oViewModel.getProperty('/raw/list');
        const iRawTotalCount = _.size(aRawList);
        const aListByDepart = _.chain(aRawList)
          .groupBy('Orgeh')
          .reduce((acc, cur) => {
            const mFappCount = _.countBy(cur, 'Fapp');
            const sDept01 = _.get(mFappCount, _.get(aGrades, [0, 'code']), 0);
            const sDept03 = _.get(mFappCount, _.get(aGrades, [1, 'code']), 0);
            const sDept05 = _.get(mFappCount, _.get(aGrades, [2, 'code']), 0);
            const sDept07 = _.get(mFappCount, '', 0);
            const sDept09 = _.chain(mFappCount).values().sum().value();

            return [
              ...acc,
              {
                Orgeh: _.get(cur, [0, 'Orgeh'], ''),
                Orgtx: _.get(cur, [0, 'Orgtx'], ''),
                Dept01: sDept01,
                Dept02: _.chain(sDept01).divide(iRawTotalCount).multiply(100).floor(1).value(),
                Dept03: sDept03,
                Dept04: _.chain(sDept03).divide(iRawTotalCount).multiply(100).floor(1).value(),
                Dept05: sDept05,
                Dept06: _.chain(sDept05).divide(iRawTotalCount).multiply(100).floor(1).value(),
                Dept07: sDept07,
                Dept08: _.chain(sDept07).divide(iRawTotalCount).multiply(100).floor(1).value(),
                Dept09: sDept09,
                Dept10: _.chain(sDept09).divide(iRawTotalCount).multiply(100).floor(1).value(),
              },
            ];
          }, [])
          .value();

        const sSumLabel = this.getBundleText('LABEL_00172'); // 합계
        const mSumRow = TableUtils.generateSumRow({
          aTableData: aListByDepart,
          mSumField: { Orgtx: sSumLabel },
          vCalcProps: /^Dept/,
        });

        _.chain(mSumRow)
          .set('Dept02', _.isEqual(_.get(mSumRow, 'Dept01'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept02'), 1))
          .set('Dept04', _.isEqual(_.get(mSumRow, 'Dept03'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept04'), 1))
          .set('Dept06', _.isEqual(_.get(mSumRow, 'Dept05'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept06'), 1))
          .set('Dept08', _.isEqual(_.get(mSumRow, 'Dept07'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept08'), 1))
          .set('Dept10', _.isEqual(_.get(mSumRow, 'Dept09'), iRawTotalCount) ? 100 : _.floor(_.get(mSumRow, 'Dept10'), 1))
          .commit();

        oViewModel.setProperty('/department/rowCount', _.chain(aListByDepart).size().add(1).value());
        oViewModel.setProperty('/department/list', [...aListByDepart, mSumRow]);
      },

      setTableData({ oViewModel, aRowData }) {
        const oTable = this.byId('gradeTable');

        oViewModel.setProperty('/list', aRowData);
        oViewModel.setProperty('/listInfo/rowCount', _.get(TableUtils.count({ oTable, aRowData }), 'rowCount', 1));
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const oRowData = oViewModel.getProperty(sPath);

        if (!_.isEqual(oRowData.Godetl, 'X')) {
          MessageBox.alert(this.getBundleText('MSG_10006')); // 현재 평가상태에서는 상세내역을 조회하실 수 없습니다.
          return;
        }

        oViewModel.setProperty('/parameter/rowData', { ...oRowData });
        this.getRouter().navTo('m/performanceGrade-detail', { group: oRowData.Zzappgr });
      },

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
