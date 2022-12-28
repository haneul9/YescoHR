sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController
  ) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.hrDocument.List', {
      ROUTE_NAME: null,
      LIST_TABLE_ID: 'hrDocumentTable',

      rowHighlight(sValue) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case 10:
          case 20:
            // 미제출
            return sap.ui.core.IndicationColor.Indication03;
          case 30:
            // 제출완료
            return sap.ui.core.IndicationColor.Indication04;
          case 40:
            // 제출마감
            return sap.ui.core.IndicationColor.Indication05;
          default:
            return null;
        }
      },

      initializeModel() {
        return {
          auth: 'E',
          contentsBusy: {
            page: false,
            button: false,
            conditions: false,
            table: false,
          },
          entry: {
            Hrdoc: [],
          },
          search: {
            Hrdoc: '',
          },
          listInfo: {
            rowCount: 1,
            totalCount: 0,
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

          await this.setHrdocEntry();

          await this.retrieveList();
        } catch (oError) {
          this.debug('Controller > hrDocument List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async setHrdocEntry() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/entry/Hrdoc', []);
          oViewModel.setProperty('/search/Hrdoc', '');

          const sAuth = oViewModel.getProperty('/auth');
          const aRowData = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocument', {
            Actty: sAuth,
            Begda: moment().hours(9).toDate(),
          });

          oViewModel.setProperty('/search/Hrdoc', 'ALL');
          oViewModel.setProperty('/entry/Hrdoc', new ComboEntry({ codeKey: 'Hrdoc', valueKey: 'Hrdoctx', aEntries: aRowData }));
        } catch (oError) {
          throw oError;
        }
      },

      async retrieveList() {
        const oViewModel = this.getViewModel();

        try {
          const oTable = this.byId(this.LIST_TABLE_ID);
          const mSearchConditions = oViewModel.getProperty('/search');
          const sAuth = oViewModel.getProperty('/auth');

          this.TableUtils.clearTable(oTable);

          const aRowData = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocSubmit', {
            Prcty: 'L',
            Actty: sAuth,
            Pernr: this.getAppointeeProperty('Pernr'),
            Hrdoc: mSearchConditions.Hrdoc,
          });

          oViewModel.setProperty('/listInfo', {
            ...oViewModel.getProperty('/listInfo'),
            ...this.TableUtils.count({ oTable, aRowData }),
            ...this.getStatusCount(aRowData),
          });
          oViewModel.setProperty(
            '/list',
            _.map(aRowData, (o) => ({
              ...o,
              BegdaFormatted: this.DateUtils.format(o.Begda),
              EnddaFormatted: this.DateUtils.format(o.Endda),
              DatumcFormatted: this.DateUtils.format(o.Datumc),
            }))
          );
        } catch (oError) {
          throw oError;
        }
      },

      getStatusCount(aRowData) {
        return _.chain(aRowData)
          .map('Status')
          .countBy()
          .defaults({
            ['10']: 0,
            ['20']: 0,
            ['30']: 0,
            ['40']: 0,
          })
          .mapKeys((v, k) => `Count${k}`)
          .tap((o) => _.set(o, 'Count20', o.Count10 + o.Count20))
          .value();
      },

      /*****************************************************************
       * ! Event handler
       *****************************************************************/
      async onPressSearch() {
        try {
          this.setContentsBusy(true, 'table');

          await this.retrieveList();
        } catch (oError) {
          this.debug('Controller > hrDocument List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, 'table');
        }
      },

      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oRowData = oViewModel.getProperty(vPath);

        if (isNaN(oRowData.Hrdoc)) return;

        if (oRowData.Hrdoc === '9000') {
          if (oRowData.Pdfurl) window.open(oRowData.Pdfurl);
        } else {
          const sMode = oRowData.Smdat ? 'D' : 'A';

          this.getRouter().navTo(`${this.ROUTE_NAME}-detail`, { mode: sMode, hrdoc: oRowData.Hrdoc, seqnr: oRowData.Seqnr });
        }
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.LIST_TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_49002'); // {HR문서제출}_목록

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
