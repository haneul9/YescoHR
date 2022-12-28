sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.documentTemplateMng.List', {
      ROUTE_NAME: null,
      LIST_TABLE_ID: 'docTmplListTable',

      initializeModel() {
        return {
          auth: 'E',
          contentsBusy: {
            page: false,
            button: false,
            conditions: false,
            table: false,
          },
          search: {
            Begda: moment().hours(9).toDate(),
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            visibleStatus: 'X',
            selectionMode: 'None',
          },
          list: [],
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        this.ROUTE_NAME = sRouteName;

        const oViewModel = this.getViewModel();

        try {
          this.setContentsBusy(true);

          const sAuth = this.getCurrentAuthChar();

          oViewModel.setProperty('/auth', sAuth);
          if (sAuth === 'H') oViewModel.setProperty('/listInfo/selectionMode', 'MultiToggle');

          await this.retrieveList();

          setTimeout(() => {
            const oDetailView = sap.ui.getCore().byId('container-ehr---documentTemplateMngDetail');
            if (oDetailView) oDetailView.destroy();

            const $detailView = $('#container-ehr---documentTemplateMngDetail');
            if ($detailView.length) $detailView.remove();

            const oRouter = this.getOwnerComponent().getRouter();
            delete oRouter._oViews._oCache.view['sap.ui.yesco.mvc.view.documentTemplateMng.Detail'];
            // debugger;
          }, 0);
        } catch (oError) {
          this.debug('Controller > documentTemplateMng List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async retrieveList() {
        const oViewModel = this.getViewModel();

        try {
          const oTable = this.byId(this.LIST_TABLE_ID);
          const mSearchConditions = oViewModel.getProperty('/search');
          const sAuth = oViewModel.getProperty('/auth');

          this.TableUtils.clearTable(oTable);

          const aRowData = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocument', {
            Actty: sAuth,
            Begda: this.DateUtils.parse(mSearchConditions.Begda),
          });

          oViewModel.setProperty('/listInfo', {
            ...oViewModel.getProperty('/listInfo'),
            ...this.TableUtils.count({ oTable, aRowData }),
          });
          oViewModel.setProperty(
            '/list',
            _.map(aRowData, (o) => ({
              ...o,
              BegdaFormatted: this.DateUtils.format(o.Begda),
              EnddaFormatted: this.DateUtils.format(o.Endda),
              DatumcFormatted: this.DateUtils.format(o.Datumc),
              DatumlFormatted: this.DateUtils.format(o.Datuml),
            }))
          );
        } catch (oError) {
          throw oError;
        }
      },

      moveDetail(mode, hrdoc = '') {
        this.getRouter().navTo(`${this.ROUTE_NAME}-detail`, { mode, hrdoc });
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        try {
          this.setContentsBusy(true, 'table');

          await this.retrieveList();
        } catch (oError) {
          this.debug('Controller > documentTemplateMng List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, 'table');
        }
      },

      onPressNew() {
        this.moveDetail('N');
      },

      onPressChange() {
        const oTable = this.byId(this.LIST_TABLE_ID);
        const aSelectedTableData = this.TableUtils.getSelectionData(oTable);

        if (aSelectedTableData.length !== 1) {
          MessageBox.alert(this.getBundleText('MSG_47001')); // 변경할 문서를 한 건만 선택하여 주십시오.
          return;
        }

        this.moveDetail('M', aSelectedTableData[0].Hrdoc);
      },

      onPressCopy() {
        const oTable = this.byId(this.LIST_TABLE_ID);
        const aSelectedTableData = this.TableUtils.getSelectionData(oTable);

        if (aSelectedTableData.length !== 1) {
          MessageBox.alert(this.getBundleText('MSG_47002')); // 복사할 문서를 한 건만 선택하여 주십시오.
          return;
        }

        this.moveDetail('C', aSelectedTableData[0].Hrdoc);
      },

      onPressDelete() {
        const oTable = this.byId(this.LIST_TABLE_ID);
        const aSelectedTableData = this.TableUtils.getSelectionData(oTable);

        if (!aSelectedTableData.length) {
          MessageBox.alert(this.getBundleText('MSG_47003')); // 삭제할 문서를 선택하여 주십시오.
          return;
        }

        this.setContentsBusy(true);

        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          actions: [this.getBundleText('LABEL_00114'), MessageBox.Action.CANCEL],
          onClose: async (sAction) => {
            if (!sAction || sAction === MessageBox.Action.CANCEL) {
              this.setContentsBusy(false);
              return;
            }

            try {
              const oModel = this.getModel(ServiceNames.PA);
              for (const mPayload of aSelectedTableData) {
                await Client.remove(oModel, 'HrDocument', _.pick(mPayload, 'Hrdoc'));
              }

              // {삭제}되었습니다.
              MessageBox.success(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.setContentsBusy(false);
                  this.onPressSearch();
                },
              });
            } catch (oError) {
              this.debug('Controller > documentTemplateMng List > onPressDelete Error', oError);

              this.setContentsBusy(false);
              AppUtils.handleError(oError);
            }
          },
        });
      },

      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oRowData = oViewModel.getProperty(vPath);

        if (isNaN(oRowData.Hrdoc)) return;

        this.moveDetail('M', oRowData.Hrdoc);
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.LIST_TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_47001'); // {HR문서}_목록

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
