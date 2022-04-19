sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/GroupDialogHandler',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    TableUtils,
    GroupDialogHandler,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.mssEvalKpi.KpiProgress', {
      TableId: 'progressTable',
      GroupDialogHandler: null,

      initializeModel() {
        return {
          busy: false,
          List: [],
          TeamList: [],
          TeamRowCount: 1,
          search: {},
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        oViewModel.setData(this.initializeModel());

        try {
          oViewModel.setProperty('/busy', true);

          // 인사영역Code
          const oModel = this.getModel(ServiceNames.COMMON);
          const aComList = await Client.getEntitySet(oModel, 'PersAreaList');

          oViewModel.setProperty('/CompanyCode', aComList);
          oViewModel.setProperty(
            '/Years',
            _.times(2, (i) => ({ Zcode: moment().subtract(i, 'years').format('YYYY'), Ztext: `${moment().subtract(i, 'years').format('YYYY')}년` }))
          );
          oViewModel.setProperty('/search', {
            Werks: this.getAppointeeProperty('Werks'),
            Syear: moment().format('YYYY'),
          });

          const aList = await this.getProgressList();
          const oTable = this.byId(this.TableId);

          oViewModel.setProperty('/List', aList);
          oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aList }));
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onSearch() {
        const oViewModel = this.getViewModel();

        try {
          const aList = await this.getProgressList();
          const oTable = this.byId(this.TableId);

          oViewModel.setProperty('/List', aList);
          oViewModel.setProperty('/listInfo', TableUtils.count({ oTable, aRowData: aList }));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // kpi/중첨추진과제 List
      getProgressList() {
        const oViewModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.APPRAISAL);
        const mSearch = oViewModel.getProperty('/search');

        return Client.getEntitySet(oModel, 'KpiProztList', _.pick(mSearch, ['Werks', 'Syear']));
      },

      // KPI/과제 명 Link Popover
      async onPressLink(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getSource().getParent().getBindingContext().getPath();
        const oRowData = oViewModel.getProperty(vPath);
        const [oUrl] = await this.getUrl(oRowData);

        window.open(oUrl.Url, '_blank');
      },

      // kpiFileUrl
      async getUrl(mSelectedRow = {}) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const oModel = this.getModel(ServiceNames.APPRAISAL);

          return await Client.getEntitySet(oModel, 'KpiCascadingFileUrl', _.pick(mSelectedRow, [Zfilekey, Zfiledoc]));
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 진척율 Click
      async onPressProgress(oEvent) {
        try {
          const oViewModel = this.getViewModel();
          const sPath = oEvent.getSource().getBindingContext().getPath();
          const aList = await this.getTeamList(oViewModel.getProperty(sPath));

          oViewModel.setProperty('/TeamList', aList);

          if (!this.dProgressDialog) {
            const oView = this.getView();

            this.dProgressDialog = Fragment.load({
              id: `${oView.getId()}-Progress`,
              name: 'sap.ui.yesco.mvc.view.mssEvalKpi.fragment.progress.ProgressDialog',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this.dProgressDialog.then(function (oDialog) {
            oDialog.open();
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      // 수행 팀 수 Link Press
      async onPressTeam(oEvent) {
        try {
          const oViewModel = this.getViewModel();
          const sPath = oEvent.getSource().getBindingContext().getPath();
          const aList = await this.getTeamList(oViewModel.getProperty(sPath));
          const iLength = aList.length;

          if (!iLength) {
            return;
          }

          oViewModel.setProperty('/TeamList', aList);
          oViewModel.setProperty('/TeamRowCount', iLength);

          if (!this.dTeamListDialog) {
            const oView = this.getView();

            this.dTeamListDialog = Fragment.load({
              id: oView.getId(),
              name: 'sap.ui.yesco.mvc.view.mssEvalKpi.fragment.tabDetail.dialog.TeamList',
              controller: this,
            }).then(function (oDialog) {
              oView.addDependent(oDialog);
              return oDialog;
            });
          }

          this.dTeamListDialog.then(function (oDialog) {
            oDialog.open();
          });
        } catch (oError) {
          AppUtils.handleError(oError);
        }
      },

      // 수행 팀 목록 조회
      getTeamList(mSelectedRow = {}) {
        this.getViewModel().setProperty('/TeamList', []);

        const oModel = this.getModel(ServiceNames.APPRAISAL);

        return Client.getEntitySet(oModel, 'KpiCascadingTeamList', _.pick(mSelectedRow, [Zyear, Otype, Objid]));
      },
    });
  }
);
