sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/control/MessageBox',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    Client,
    ServiceNames,
    BaseController,
    MessageBox
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.csr.csr', {
      LIST_TABLE_ID: 'csrListTable',
      ROUTE_MAP: {
        csrMng: 'H',
        csrAppr: 'M',
        csrAppl: 'E',
      },

      initializeModel() {
        return {
          busy: false,
          routeName: '',
          auth: 'E',
          search: {
            Werks: '',
            Begda: moment().subtract(1, 'months').add(1, 'days').hours(9).toDate(),
            Endda: moment().hours(9).toDate(),
            Schty: 'X',
          },
          entry: {
            Werks: [],
          },
          listInfo: {
            Title: '',
            isShowProgress: false,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: false,
            isShowComplete: true,
            ObjTxt2: '',
            ObjTxt3: '',
            ObjTxt5: '',
            rowCount: 3,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
          List: [],
          SelectedRows: [],
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);
          oListModel.setProperty('/routeName', sRouteName);
          oListModel.setProperty('/auth', this.ROUTE_MAP[sRouteName] || 'E');

          const mAppointee = this.getAppointeeData();
          const aPersaEntry = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'WerksList', { Pernr: mAppointee.Pernr });

          oListModel.setProperty('/entry/Werks', aPersaEntry);
          oListModel.setProperty('/search/Werks', mAppointee.Werks);

          const mListInfo = oListModel.getProperty('/listInfo');

          oListModel.setProperty('/listInfo', {
            ...mListInfo,
            Title: this.getBundleText('LABEL_46016'), // 상세내역
            ObjTxt2: this.getBundleText('LABEL_46001'), // 신청단계
            ObjTxt3: this.getBundleText('LABEL_46002'), // 처리단계
            ObjTxt5: this.getBundleText('LABEL_46003'), // 완료단계
            isShowProgress: false,
            isShowApply: true,
            isShowApprove: true,
            isShowReject: false,
            isShowComplete: true,
          });

          await this.readList();

          setTimeout(() => {
            const oDetailView = sap.ui.getCore().byId('container-ehr---csrDetail');
            if (oDetailView) oDetailView.destroy();

            const $detailView = $('#container-ehr---csrDetail');
            if ($detailView.length) $detailView.remove();

            const oRouter = this.getOwnerComponent().getRouter();
            delete oRouter._oViews._oCache.view['sap.ui.yesco.mvc.view.csr.csrDetail'];
          }, 0);
        } catch (oError) {
          this.debug(`Controller > ${sRouteName} List > onObjectMatched Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      async callbackAppointeeChange() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          await this.readList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      onClick() {
        const sRouteName = this.getViewModel().getProperty('/routeName');
        const sWerks = this.getViewModel().getProperty('/search/Werks');

        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: 'N', werks: sWerks });
      },

      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          await this.readList();
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      async readList() {
        const oListModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.COMMON);
          const oSearch = oListModel.getProperty('/search');
          const sAuth = oListModel.getProperty('/auth');

          const aTableList = await Client.getEntitySet(oModel, 'CsrRequest', {
            Austy: sAuth,
            Werks: oSearch.Werks,
            Begda: moment(oSearch.Begda).hours(9).toDate(),
            Endda: moment(oSearch.Endda).hours(9).toDate(),
            Schty: sAuth === 'M' ? (oSearch.Schty === 'A' ? '' : oSearch.Schty) : '', // CSR결재: 조회구분
          });

          oListModel.setProperty('/List', aTableList);

          const iVisibleRowCountLimit = this.TableUtils.calculateVisibleRowCount(this.byId(this.LIST_TABLE_ID));
          const mListInfo = oListModel.getProperty('/listInfo');
          const iDataLength = aTableList.length;
          const oOccurCount = _.chain(aTableList)
            .map('Prstg')
            .countBy()
            .defaults({
              ['']: 0,
              ['10']: 0,
              ['20']: 0,
              ['30']: 0,
            })
            .value();

          oListModel.setProperty('/listInfo', {
            ...mListInfo,
            rowCount: Math.min(iVisibleRowCountLimit, iDataLength),
            totalCount: aTableList.length,
            applyCount: oOccurCount['10'],
            approveCount: oOccurCount['20'],
            completeCount: oOccurCount['30'],
          });

          oListModel.setProperty('/SelectedRows', []);

          if (sAuth === 'M') this.setTableStyle();
        } catch (oError) {
          throw oError;
        }
      },

      onSelectionTable(oEvent) {
        const oViewModel = this.getViewModel();
        const oTable = oEvent.getSource();
        const aList = oViewModel.getProperty('/List');

        if (oEvent.getParameter('selectAll') === true) {
          _.forEach(aList, (o, i) => {
            if (o.Appryn === '') oTable.removeSelectionInterval(i, i);
          });
        }

        const aSelectedIndices = oTable.getSelectedIndices();

        _.forEach(aList, (o, i) => _.set(o, 'Checked', _.includes(aSelectedIndices, i)));
        oViewModel.refresh();

        this.setTableStyle();

        const aMappedIndices = oTable.getBindingInfo('rows').binding.aIndices;

        oViewModel.setProperty(
          '/SelectedRows',
          _.map(aSelectedIndices, (e) => {
            return oViewModel.getProperty(`/List/${aMappedIndices[e]}`);
          })
        );
      },

      setTableStyle() {
        setTimeout(() => {
          const oTable = this.byId(this.LIST_TABLE_ID);
          const sTableId = oTable.getId();

          oTable.getRows().forEach((row, i) => {
            const mRowData = row.getBindingContext().getObject();
            if (mRowData.Appryn === 'X') {
              $(`#${sTableId}-rowsel${i}`).removeClass('disabled-table-selection');
            } else {
              $(`#${sTableId}-rowsel${i}`).addClass('disabled-table-selection');
            }
          });
        }, 100);
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getParameter('rowBindingContext').getPath();
        const oListModel = this.getViewModel();
        const oRowData = oListModel.getProperty(vPath);
        const sRouteName = oListModel.getProperty('/routeName');

        oListModel.setProperty('/parameters', oRowData);
        this.getRouter().navTo(`${sRouteName}-detail`, { oDataKey: oRowData.Appno, werks: oRowData.Werks });
      },

      onPressAccept() {
        this.onSave('B');
      },

      onPressReject() {
        this.onSave('C');
      },

      async onSave(vPrcty) {
        const oViewModel = this.getViewModel();
        const aSelectedData = oViewModel.getProperty('/SelectedRows');

        if (aSelectedData.length === 0) {
          MessageBox.alert(this.getBundleText('MSG_46005')); // 데이터를 선택하여 주십시오.
          return;
        }

        const sMessage = vPrcty === 'B' ? 'LABEL_00123' : 'LABEL_00124';

        // {승인|반려}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', sMessage), {
          onClose: async (vPress) => {
            if (vPress && vPress === 'OK') {
              try {
                AppUtils.setAppBusy(true);

                await this.onProcess(aSelectedData, vPrcty, sMessage);
              } catch (oError) {
                AppUtils.handleError(oError);

                if (oDetailModel.getProperty('/isNew') === true) {
                  oDetailModel.setProperty('/Data/Prsta', '');
                  oDetailModel.setProperty('/Data/Prstg', '');
                }
              } finally {
                AppUtils.setAppBusy(false);
              }
            }
          },
        });
      },

      async onProcess(aSelectedData, vPrcty, sMessage) {
        const oModel = this.getModel(ServiceNames.COMMON);

        try {
          for (const el of aSelectedData) {
            el.Prcty = vPrcty;

            // 승인시 진행상태 값
            if (vPrcty === 'B') {
              const iPrsta = _.toInteger(el.Prsta);

              switch (true) {
                case iPrsta === 10:
                  el.Prsta = '11';
                  break;
                case iPrsta === 11:
                  el.Prsta = '12';
                  break;
                case iPrsta >= 22:
                  el.Prsta = '30';
                  break;
                default:
                  delete el.Prsta;
                  break;
              }
            }

            await Client.create(oModel, 'CsrRequestApproval', el);
          }

          // {승인|반려}되었습니다.
          MessageBox.alert(this.getBundleText('MSG_00007', sMessage), {
            onClose: () => {
              this.onSearch();
              this.byId(this.LIST_TABLE_ID).clearSelection();
            },
          });
        } catch (oError) {
          this.debug(`Controller > ${this.getViewModel().getProperty('/routeName')} List > onProcess Error`, oError);

          AppUtils.handleError(oError);
        }
      },

      onPressExcelDownload() {
        const oTable = this.byId(this.LIST_TABLE_ID);
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_46000'); // CSR_목록

        this.TableUtils.export({ oTable, sFileName });
      },

      rowHighlight(sValue) {
        const vValue = !parseInt(sValue, 10) ? sValue : parseInt(sValue, 10);

        switch (vValue) {
          case 10:
            // 신청
            return sap.ui.core.IndicationColor.Indication03;
          case 20:
            // 승인
            return sap.ui.core.IndicationColor.Indication04;
          case 30:
            // 완료
            return sap.ui.core.IndicationColor.Indication05;
          default:
            return null;
        }
      },
    });
  }
);
