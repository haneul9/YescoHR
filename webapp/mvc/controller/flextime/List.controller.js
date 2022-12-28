sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    MessageBox,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.flextime.List', {
      sRouteName: null,

      initializeModel() {
        return {
          auth: '',
          busy: {
            Button: false,
            Summary: false,
            Input: false,
          },
          entry: {
            Werks: [],
            Orgeh: [],
          },
          searchConditions: {
            Zyymm: null,
            Werks: null,
            Orgeh: null,
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            isShowProgress: false,
            progressCount: 0,
            ObjTxt2: this.getBundleText('LABEL_40035'), // 진행중
            isShowApply: true,
            applyCount: 0,
            ObjTxt3: this.getBundleText('LABEL_40030'), // 확정
            isShowApprove: true,
            approveCount: 0,
            ObjTxt4: this.getBundleText('LABEL_40034'), // 에러
            isShowReject: true,
            rejectCount: 0,
            isShowComplete: false,
            completeCount: 0,
          },
          summary: {
            rowCount: 1,
            list: [],
          },
          isHass: false,
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        try {
          this.setContentsBusy(true);

          this.sRouteName = sRouteName;

          await this.initializeSearchConditions();
          await this.readFlextimeList();
        } catch (oError) {
          this.debug('Controller > flextime List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async initializeSearchConditions() {
        const oViewModel = this.getViewModel();

        try {
          const oCommonModel = this.getModel(ServiceNames.COMMON);
          const mSearchConditions = oViewModel.getProperty('/searchConditions');
          const mAppointee = this.getAppointeeData();
          const [aPersaEntry, aOrgehEntry] = await Promise.all([
            Client.getEntitySet(oCommonModel, 'WerksList', { Pernr: mAppointee.Pernr }), //
            Client.getEntitySet(oCommonModel, 'DashboardOrgList', { Werks: mAppointee.Werks, Pernr: mAppointee.Pernr }),
          ]);

          oViewModel.setProperty('/isHass', this.isHass());
          oViewModel.setProperty('/searchConditions', {
            Zyymm: _.isEmpty(mSearchConditions.Zyymm) ? moment().format('YYYYMM') : mSearchConditions.Zyymm,
            Werks: _.isEmpty(mSearchConditions.Werks) ? mAppointee.Werks : mSearchConditions.Werks,
            Orgeh: _.isEmpty(mSearchConditions.Orgeh) ? (_.some(aOrgehEntry, (o) => o.Orgeh === mAppointee.Orgeh) ? mAppointee.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh'])) : mSearchConditions.Orgeh,
          });
          oViewModel.setProperty(
            '/entry/Werks',
            _.map(aPersaEntry, (o) => _.chain(o).omit('__metadata').omitBy(_.isNil).omitBy(_.isEmpty).value())
          );
          oViewModel.setProperty(
            '/entry/Orgeh',
            _.map(aOrgehEntry, (o) => _.chain(o).omit('__metadata').omitBy(_.isNil).omitBy(_.isEmpty).value())
          );
        } catch (oError) {
          throw oError;
        }
      },

      async onPressSearch() {
        try {
          this.setContentsBusy(true, ['Button', 'Summary']);

          await this.readFlextimeList();
        } catch (oError) {
          this.debug('Controller > Flextime List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Button', 'Summary']);
        }
      },

      async readFlextimeList() {
        try {
          const oViewModel = this.getViewModel();
          const oTable = this.byId('flextimeSummaryListTable');
          const mSearchConditions = oViewModel.getProperty('/searchConditions');

          const aRowData = await Client.getEntitySet(this.getModel(ServiceNames.WORKTIME), 'FlexTimeList', {
            Menid: this.getCurrentMenuId(),
            ...mSearchConditions,
          });

          oViewModel.setProperty('/summary/rowCount', _.get(this.TableUtils.count({ oTable, aRowData }), 'rowCount', 1));
          oViewModel.setProperty(
            '/summary/list',
            _.map(aRowData, (o, i) => ({
              ..._.omit(o, '__metadata'),
              Idx: ++i,
              Status: o.Hrcfm == 'X' ? '40' : o.Erryn == 'X' ? '45' : '20',
              Statustx: o.Hrcfm == 'X' ? this.getBundleText('LABEL_40030') : o.Erryn == 'X' ? this.getBundleText('LABEL_40034') : this.getBundleText('LABEL_40035'),
              ZappStatAl: o.Hrcfm == 'X' ? '50' : o.Erryn == 'X' ? '40' : '20',
              Gaptim: _.toNumber(o.Gaptim),
              Gaptimtx: _.toNumber(o.Gaptim) > 0 ? `+${_.toNumber(o.Gaptim)}` : _.toNumber(o.Gaptim).toString(),
            }))
          );

          // this.setTableData(oViewModel, oViewModel.getProperty('/summary/list'));

          const aRowData2 = oViewModel.getProperty('/summary/list');
          var iApplyCount = 0,
            iApproveCount = 0,
            iRejectCount = 0;

          _.map(aRowData2, function (o, i) {
            switch (o.ZappStatAl) {
              case '20':
                iApplyCount++;
                break;
              case '40':
                iRejectCount++;
                break;
              case '50':
                iApproveCount++;
                break;
            }
          });

          oViewModel.setProperty('/listInfo/applyCount', iApplyCount);
          oViewModel.setProperty('/listInfo/approveCount', iApproveCount);
          oViewModel.setProperty('/listInfo/rejectCount', iRejectCount);
        } catch (oError) {
          throw oError;
        }
      },

      async onChangeWerks() {
        const oViewModel = this.getViewModel();

        try {
          this.setContentsBusy(true, ['Input', 'Button']);

          const mAppointeeData = this.getAppointeeData();
          const aOrgehEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'DashboardOrgList', {
            Werks: oViewModel.getProperty('/searchConditions/Werks'),
            Pernr: mAppointeeData.Pernr,
          });

          oViewModel.setProperty('/entry/Orgeh', aOrgehEntry);
          oViewModel.setProperty('/searchConditions/Orgeh', _.some(aOrgehEntry, (o) => o.Orgeh === mAppointeeData.Orgeh) ? mAppointeeData.Orgeh : _.get(aOrgehEntry, [0, 'Orgeh']));
        } catch (oError) {
          this.debug('Controller > Flextime List > onChangeWerks Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Input', 'Button']);
        }
      },

      // setContentsBusy(bContentsBusy = true, vTarget = []) {
      //   const oViewModel = this.getViewModel();
      //   const mBusy = oViewModel.getProperty('/busy');

      //   if (_.isEmpty(vTarget)) {
      //     _.forOwn(mBusy, (v, p) => _.set(mBusy, p, bContentsBusy));
      //   } else {
      //     if (_.isArray(vTarget)) {
      //       _.forEach(vTarget, (s) => _.set(mBusy, s, bContentsBusy));
      //     } else {
      //       _.set(mBusy, vTarget, bContentsBusy);
      //     }
      //   }

      //   oViewModel.refresh();
      // },

      onSelectRow(oEvent) {
        const sPath = oEvent.getParameters().rowBindingContext.getPath();
        const mRowData = this.getViewModel().getProperty(sPath);

        this.getRouter().navTo(`${this.sRouteName}-detail`, { pernr: mRowData.Pernr, zyymm: mRowData.Zyymm });
      },

      onPressExcelDownload() {
        const oTable = this.byId('flextimeSummaryListTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_40007'); // {선택적근로제 현황}_목록

        this.TableUtils.export({ oTable, sFileName });
      },

      onHRConfirm() {
        try {
          const oViewModel = this.getViewModel();
          const aDetailsList = oViewModel.getProperty('/summary/list');
          const aSelectedIndices = this.byId('flextimeSummaryListTable').getSelectedIndices();

          if (aSelectedIndices.length == 0) {
            MessageBox.alert(this.getBundleText('MSG_40006', 'LABEL_40030')); // {확정}할 데이터를 선택하여 주십시오.
            return;
          }

          const aSelectData = _.map(aSelectedIndices, (d) => _.get(aDetailsList, [d]));
          const sFlag = _.find(aSelectData, (e) => {
            return e.Hrcfm === 'X';
          })
            ? 'X'
            : '';

          if (sFlag == 'X') {
            MessageBox.alert(this.getBundleText('MSG_40007')); // 선택한 데이터 중 이미 확정된 데이터가 존재합니다.
            return;
          }

          MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_40030'), {
            // {확정}하시겠습니까?
            onClose: async (sAction) => {
              if (MessageBox.Action.CANCEL === sAction) {
                this.setContentsBusy(false, ['Button', 'Summary']);
                return;
              }
              this.setContentsBusy(true, ['Button', 'Summary']);

              await this.createProcess(aSelectData, 'C');

              this.byId('flextimeSummaryListTable').clearSelection();
              // MessageBox.alert(this.getBundleText('MSG_40008', 'LABEL_40030'), { // {확정취소} 처리가 완료되었습니다.
              //   onClose: () => {this.readFlextimeList(); this.setContentsBusy(false, ['Button', 'Summary']);}
              // });
            },
          });
        } catch (oError) {
          this.debug('Controller > flextime > List > onHRConfirm Error', oError);

          this.setContentsBusy(false, ['Button', 'Summary']);
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Button', 'Summary']);
        }
      },

      onHRCancel() {
        try {
          const oViewModel = this.getViewModel();
          const aDetailsList = oViewModel.getProperty('/summary/list');
          const aSelectedIndices = this.byId('flextimeSummaryListTable').getSelectedIndices();

          if (aSelectedIndices.length == 0) {
            MessageBox.alert(this.getBundleText('MSG_40006', 'LABEL_40031')); // {확정취소}할 데이터를 선택하여 주십시오.
            return;
          }

          const aSelectData = _.map(aSelectedIndices, (d) => _.get(aDetailsList, [d]));

          const sFlag = _.find(aSelectData, (e) => {
            return e.Hrcfm === '';
          })
            ? 'X'
            : '';

          if (sFlag == 'X') {
            MessageBox.alert(this.getBundleText('MSG_40009')); // 선택한 데이터 중 확정 상태가 아닌 데이터가 존재합니다.
            return;
          }

          MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_40031'), {
            // {확정취소}하시겠습니까?
            onClose: async (sAction) => {
              if (MessageBox.Action.CANCEL === sAction) {
                this.setContentsBusy(false, ['Button', 'Summary']);
                return;
              }
              this.setContentsBusy(true, ['Button', 'Summary']);

              await this.createProcess(aSelectData, 'D');

              this.byId('flextimeSummaryListTable').clearSelection();
              // MessageBox.alert(this.getBundleText('MSG_40008', 'LABEL_40031'), { // {확정취소} 처리가 완료되었습니다.
              //   onClose: () => {this.readFlextimeList(); this.setContentsBusy(false, ['Button', 'Summary']);}
              // });
            },
          });
        } catch (oError) {
          this.debug('Controller > flextime > List > onHRConfirm Error', oError);

          this.setContentsBusy(false, ['Button', 'Summary']);
          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, ['Button', 'Summary']);
        }
      },

      // C 확정, D 확정취소
      async createProcess(aData, sPrcty) {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        try {
          await Promise.all(_.map(aData, async (o) => Client.create(oModel, 'FlexTimeSummary', { ...o, Prcty: sPrcty })));

          MessageBox.alert(this.getBundleText('MSG_40008', sPrcty == 'C' ? 'LABEL_40030' : 'LABEL_40031')); // {확정|확정취소} 처리가 완료되었습니다.
          this.readFlextimeList();
          this.setContentsBusy(false, ['Button', 'Summary']);
        } catch (oError) {
          setTimeout(() => this.setContentsBusy(false, ['Input', 'Button']), 1000);
          throw oError;
        }
      },
    });
  }
);
