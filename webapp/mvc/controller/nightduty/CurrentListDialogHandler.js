sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/model/json/JSONModel',
    'sap/ui/table/SelectionMode',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/Debuggable',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    JSONModel,
    SelectionMode,
    AppUtils,
    ComboEntry,
    Debuggable,
    TableUtils,
    Client,
    ServiceNames
  ) => {
    'use strict';

    return Debuggable.extend('sap.ui.yesco.mvc.controller.nightduty.CurrentListDialogHandler', {
      constructor: function ({ oController, sPrcty = 'R', sSelectionMode = SelectionMode.None, fnCallback = () => {} }) {
        this.oController = oController;
        this.sPrcty = sPrcty;
        this.sSelectionMode = sSelectionMode;
        this.fnCallback = fnCallback;
        this.oCurrentListDialog = null;
        this.sCurrentListTableId = 'currentListTable';
        this.sThisMonth = moment().hours(9).format(oController.getSessionProperty('DTFMTYYYYMM'));
        this.oDialogModel = new JSONModel(this.getInitData());

        this.initDialog();
      },

      getInitData() {
        return {
          dialog: {
            busy: true,
            enabled: false,
            yearMonth: this.sThisMonth,
            selectedDutyGroup: 'ALL',
            dutyGroups: new ComboEntry({
              aEntries: [
                { code: 'A', text: 'A' },
                { code: 'B', text: 'B' },
              ],
            }),
            currentList: null,
            currentListRowCount: 0,
            currentListMode: this.sSelectionMode,
            selectedList: [],
            pernrList: [],
          },
        };
      },

      async initDialog() {
        const oView = this.oController.getView();

        this.oCurrentListDialog = await Fragment.load({
          id: oView.createId(this.sSelectionMode.toLowerCase()),
          name: 'sap.ui.yesco.mvc.view.nightduty.fragment.CurrentListDialog',
          controller: this,
        });

        oView.addDependent(this.oCurrentListDialog);

        this.oCurrentListDialog
          .setModel(this.oDialogModel)
          .bindElement('/dialog')
          .attachBeforeOpen(() => {
            this.initDialogData();
            this.onPressCurrentListSearch();
          })
          .attachAfterClose(() => {
            this.initDialogData();
          });
      },

      openDialog(aPernrList = []) {
        this.oDialogModel.setProperty('/dialog/pernrList', aPernrList || []);

        this.oCurrentListDialog.open();
      },

      /**
       *
       */
      initDialogData() {
        if (this.sSelectionMode === SelectionMode.MultiToggle) {
          this.oController.byId(`${this.sSelectionMode.toLowerCase()}--${this.sCurrentListTableId}`).clearSelection();
        }

        const aPernrList = this.oDialogModel.getProperty('/dialog/pernrList');

        this.oDialogModel.setData(this.getInitData());
        this.oDialogModel.setProperty('/dialog/pernrList', aPernrList || []);
      },

      onChangeYearMonth() {
        this.onPressCurrentListSearch();
      },

      onChangeDutyGroup() {
        this.onPressCurrentListSearch();
      },

      /**
       * 나의 당직근무 - 당직근무현황 조회 아이콘 press event handler
       */
      async onPressCurrentListSearch() {
        try {
          this.oDialogModel.setProperty('/dialog/busy', true);

          const aCurrentListTableData = await this.readCurrentListTableData();

          this.setCurrentListTableData(aCurrentListTableData);
        } catch (oError) {
          this.debug('controller.nightduty.CurrentListDialogHandler > onPressCurrentListSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.oDialogModel.setProperty('/dialog/busy', false);
        }
      },

      async readCurrentListTableData() {
        const aPernrList = this.oDialogModel.getProperty('/dialog/pernrList');
        const sYearMonth = this.oDialogModel.getProperty('/dialog/yearMonth').replace(/\D/g, '');
        const sSelectedDutyGroup = this.oDialogModel.getProperty('/dialog/selectedDutyGroup');

        const oModel = this.oController.getModel(ServiceNames.WORKTIME);
        const mFilters = {
          Begmm: sYearMonth, // prettier 방지용 주석
          Endmm: sYearMonth,
          Ocshf: sSelectedDutyGroup,
          Prcty: this.sPrcty,
        };
        if (aPernrList.length) {
          mFilters.Pernr = aPernrList;
        }

        return Client.getEntitySet(oModel, 'OnCallList', mFilters);
      },

      setCurrentListTableData(aCurrentListTableData) {
        const iCurrentListRowCount = (aCurrentListTableData || []).length;

        this.oDialogModel.setProperty('/dialog/currentList', aCurrentListTableData);
        this.oDialogModel.setProperty('/dialog/currentListRowCount', iCurrentListRowCount > 10 ? 10 : iCurrentListRowCount);
        if (this.sSelectionMode === SelectionMode.MultiToggle) {
          this.oDialogModel.setProperty('/dialog/selectedList', []);
          this.oDialogModel.setProperty('/dialog/enabled', false);
        }
      },

      onChangeRowSelection(oEvent) {
        if (this.sSelectionMode !== SelectionMode.MultiToggle) {
          return;
        }

        const oTable = oEvent.getSource();
        const aSelectedIndices = oTable.getSelectedIndices();

        this.oDialogModel.setProperty('/dialog/enabled', aSelectedIndices.length > 0);
        this.oDialogModel.setProperty(
          '/dialog/selectedList',
          aSelectedIndices.map((i) => this.oDialogModel.getProperty(`/dialog/currentList/${i}`))
        );
      },

      onPressSelectionDone() {
        const aSelectedListData = this.oDialogModel.getProperty('/dialog/selectedList');

        this.fnCallback(aSelectedListData);

        this.onPressDialogClose();
      },

      onPressDialogClose() {
        this.oCurrentListDialog.close();
      },

      onPressExcelDownload() {
        const sSelectionMode = this.sSelectionMode.toLowerCase();
        const oTable = this.oController.byId(`${sSelectionMode}--currentListTable`);
        const sFileName = this.oController.getBundleText('LABEL_00282', 'LABEL_06007'); // {당직근무현황}_목록

        TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
