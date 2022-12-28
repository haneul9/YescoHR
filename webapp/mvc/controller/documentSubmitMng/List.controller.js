sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.documentSubmitMng.List', {
      ROUTE_NAME: null,
      LIST_TABLE_ID: 'docSubmitListTable',

      rowHighlight(sValue) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case 10:
            // 미제출
            return sap.ui.core.IndicationColor.Indication02;
          case 20:
            // 제출중
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
            Werks: [],
          },
          search: {
            Werks: '',
            Begda: moment().startOf('year').hours(9).toDate(),
            Endda: moment().endOf('year').hours(9).toDate(),
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

          await this.setWerksEntry();

          await this.retrieveList();
        } catch (oError) {
          this.debug('Controller > documentSubmitMng List > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false);
        }
      },

      async setWerksEntry() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/entry/Werks', []);
          oViewModel.setProperty('/search/Werks', '');

          const aEntries = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'WerksList', {
            Pernr: this.getAppointeeProperty('Pernr'),
          });

          oViewModel.setProperty('/entry/Werks', aEntries);
          oViewModel.setProperty('/search/Werks', this.getAppointeeProperty('Werks'));
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

          const aRowData = await Client.getEntitySet(this.getViewModel(ServiceNames.PA), 'HrDocManage', {
            Actty: sAuth,
            Werks: mSearchConditions.Werks,
            Begda: this.DateUtils.parse(mSearchConditions.Begda),
            Endda: this.DateUtils.parse(mSearchConditions.Endda),
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
          this.debug('Controller > documentSubmitMng List > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          this.setContentsBusy(false, 'table');
        }
      },

      onPressNew() {
        this.getRouter().navTo(`${this.ROUTE_NAME}-detail`, { werks: 'N' });
      },

      onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oRowData = oViewModel.getProperty(vPath);
        const sWerks = this.getAppointeeProperty('Werks');

        if (isNaN(oRowData.Hrdoc)) return;

        this.getRouter().navTo(`${this.ROUTE_NAME}-detail`, { werks: sWerks, hrdoc: oRowData.Hrdoc, seqnr: oRowData.Seqnr });
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.LIST_TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_48011'); // {HR문서제출관리}_목록

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
