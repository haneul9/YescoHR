sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/BoxHandler',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/exceptions/ODataReadError',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    Filter,
    FilterOperator,
    AppUtils,
    BoxHandler,
    ComboEntry,
    TableUtils,
    ODataReadError,
    ServiceNames
  ) => {
    'use strict';

    return BoxHandler.extend('sap.ui.yesco.mvc.controller.nightduty.SummaryBoxHandler', {
      /**
       * @override
       */
      init() {
        this.oDoneListDialog = null;
        this.sDoneListTableId = 'doneListTable';
        this.YYYY = this.oController.getSessionProperty('DTFMTYYYY');
        this.YYYYMM = this.oController.getSessionProperty('DTFMTYYYYMM');

        const oTodayMoment = moment().hours(9);
        this.sThisYear = oTodayMoment.format(this.YYYY);
        this.sThisMonth = oTodayMoment.format(this.YYYYMM);

        this.oViewModel.setData({
          summary: {
            busy: true,
            year: this.sThisYear,
            yearMonth: this.oController.getBundleText('MSG_06002', oTodayMoment.format('YYYY'), oTodayMoment.format('M')),
          },
          dialog: {
            busy: true,
            yearMonth: this.sThisMonth,
            selectedDutyGroup: 'ALL',
            dutyGroups: new ComboEntry({
              aEntries: [
                { code: 'A', text: 'A' },
                { code: 'B', text: 'B' },
              ],
            }),
            doneList: null,
          },
        });

        this.showSummaryData();
      },

      /**
       * 나의 당직근무 정보 조회
       */
      async showSummaryData() {
        try {
          this.setBusy('/summary/busy', true);

          const mSummaryData = this.readSummaryData();

          this.setSummaryData(await mSummaryData);
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty Summary > showSummaryData Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setBusy('/summary/busy', false);
        }
      },

      /**
       *
       * @returns
       */
      async readSummaryData() {
        return new Promise((resolve, reject) => {
          const sUrl = '/OnCallSummarySet';
          const sPernr = this.oController.getAppointeeProperty('Pernr');

          this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: [
              new Filter('Pernr', FilterOperator.EQ, sPernr), //
            ],
            success: (mData) => {
              AppUtils.debug(`${sUrl} success.`, mData);

              resolve(mData.results);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      /**
       * @param {object} mSummaryData
       */
      setSummaryData(mSummaryData) {
        this.oViewModel.setData({ summary: mSummaryData }, true);
      },

      /**
       * @override
       */
      async onPressIcon() {
        this.setBusy('/summary/busy', true);

        if (!this.oDoneListDialog) {
          this.oDoneListDialog = await Fragment.load({
            name: 'sap.ui.yesco.mvc.view.nightduty.fragment.DoneListDialog',
            controller: this.oController,
          });

          this.oController.getView().addDependent(this.oDoneListDialog);
          this.oDoneListDialog
            .attachBeforeOpen(() => {
              this.setBusy('/dialog/busy', true);

              this.initDoneListSearchConditions();
              this.onPressDoneListSearch();
            })
            .attachAfterClose(() => {
              this.clearDialog();
            });
        }

        this.oDoneListDialog.open();

        this.setBusy('/summary/busy', false);
      },

      /**
       *
       */
      onPressDoneListDialogClose() {
        this.oDoneListDialog.close();
      },

      /**
       *
       */
      async initDoneListSearchConditions() {
        try {
          this.oViewModel.setProperty('/dialog/yearMonth', this.sThisMonth);
          this.oViewModel.setProperty('/dialog/selectedDutyGroup', 'ALL');
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty Summary > Dialog > initDoneListSearchConditions Error', oError);

          AppUtils.handleError(oError);
        }
      },

      /**
       * 나의 당직근무 - 당직근무현황 조회 아이콘 press event hamdler
       */
      async onPressDoneListSearch() {
        try {
          this.oDoneListDialog.setBusy(true);

          const aDoneListTableData = this.readDoneListTableData();

          this.setDoneListTableData(await aDoneListTableData);
        } catch (oError) {
          AppUtils.debug('Controller > Nightduty Summary > Dialog > onPressDoneListSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.oDoneListDialog.setBusy(false);
        }
      },

      async readDoneListTableData() {
        return new Promise((resolve, reject) => {
          const sUrl = '/OnCallSummarySet';
          const sPernr = this.oController.getAppointeeProperty('Pernr');

          this.oController.getModel(ServiceNames.WORKTIME).read(sUrl, {
            filters: [
              new Filter('Pernr', FilterOperator.EQ, sPernr), //
            ],
            success: (mData) => {
              AppUtils.debug(`${sUrl} success.`, mData);

              resolve(mData.results);
            },
            error: (oError) => {
              AppUtils.debug(`${sUrl} error.`, oError);

              reject(new ODataReadError(oError));
            },
          });
        });
      },

      setDoneListTableData(aRowData = []) {
        this.oViewModel.setProperty('/dialog/list', aRowData);
      },

      onChangeRowSelection() {},
    });
  }
);
