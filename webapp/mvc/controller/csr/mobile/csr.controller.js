sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    ServiceNames,
    AppUtils,
    Client,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.csr.mobile.csr', {
      initializeModel() {
        return {
          busy: false,
          search: {
            dateRange: '1w',
            secondDate: moment().toDate(),
            date: moment().subtract(6, 'day').toDate(),
            dateBox: false,
            select1: null,
            select2: null,
            visible: {
              select1: true,
              select2: true,
            },
            entry: {
              select1: [], // 인사영역
              select2: [], // 전체,미결
            },
          },
          list: [],
          listInfo: {
            rowCount: 1,
            popover: true,
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

        try {
          oViewModel.setProperty('/busy', true);

          const sSearchWerks = oViewModel.getProperty('/search/select1');

          if (!sSearchWerks) {
            this.setListInfo();
            this.setSearchEntry();
            await this.setWerksEntry();
          }

          await this.retrieveList();
        } catch (oError) {
          this.debug('Controller > Mobile-csrAppr-csr > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async setWerksEntry() {
        const oViewModel = this.getViewModel();

        try {
          const mAppointee = this.getAppointeeData();
          const aWerks = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'WerksList', { Pernr: mAppointee.Pernr });

          oViewModel.setProperty('/search/select1', mAppointee.Werks);
          oViewModel.setProperty(
            '/search/entry/select1',
            _.map(aWerks, (el) => ({ code: el.Werks, text: el.Pbtxt }))
          );
        } catch (oError) {
          throw oError;
        }
      },

      setSearchEntry() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/search/select2', 'X');
        oViewModel.setProperty('/search/entry/select2', [
          { code: 'ALL', text: this.getBundleText('LABEL_46037') }, // 전체조회
          { code: 'X', text: this.getBundleText('LABEL_46038') }, // 미결사항만 조회
        ]);
      },

      setListInfo() {
        const oViewModel = this.getViewModel();
        const mListInfo = oViewModel.getProperty('/listInfo');

        oViewModel.setProperty('/listInfo', {
          ...mListInfo,
          isShowProgress: false,
          isShowReject: false,
          ObjTxt2: this.getBundleText('LABEL_46001'), // 신청단계
          ObjTxt3: this.getBundleText('LABEL_46002'), // 처리단계
          ObjTxt5: this.getBundleText('LABEL_46003'), // 완료단계
        });
      },

      async retrieveList() {
        const oViewModel = this.getViewModel();

        try {
          const oModel = this.getModel(ServiceNames.COMMON);
          const mSearchConditions = oViewModel.getProperty('/search');

          const aRowData = await Client.getEntitySet(oModel, 'CsrRequest', {
            Austy: 'M',
            Prcty: 'M',
            Werks: mSearchConditions.select1,
            Schty: mSearchConditions.select2, // 미결만 조회 여부
            Begda: moment(mSearchConditions.date).hours(9).toDate(),
            Endda: moment(mSearchConditions.secondDate).hours(9).toDate(),
          });

          const sRequestText = this.getBundleText('LABEL_46044'); // 요청
          const mCompanyIcon = {
            1000: '/sap/public/bc/ui2/zui5_yescohr/images/icon_YH.svg',
            2000: '/sap/public/bc/ui2/zui5_yescohr/images/icon_YS.svg',
            3000: '/sap/public/bc/ui2/zui5_yescohr/images/icon_HS.svg',
            4000: '/sap/public/bc/ui2/zui5_yescohr/images/icon_YI.svg',
          };

          oViewModel.setProperty('/listInfo/totalCount', aRowData.length);
          oViewModel.setProperty(
            '/list',
            _.map(aRowData, (el) => ({
              ...el,
              ZappStatAl: `CSR${el.Prstg}`,
              CompanyIcon: _.get(mCompanyIcon, el.Werks),
              ReqdatFormatted: `${moment(el.Reqdat).hours(9).format('MM/DD')} ${sRequestText}`,
            }))
          );

          this.byId('listScrollContainer').scrollTo(0, 0, 100);
          oViewModel.refresh(true);
        } catch (oError) {
          throw oError;
        }
      },

      onPressApproval() {
        this.processApproval('B');
      },

      onPressReject() {
        this.processApproval('C');
      },

      async processApproval(vPrcty) {
        const oViewModel = this.getViewModel();
        const aSelectedRowsData = _.chain(oViewModel.getProperty('/list')).cloneDeep().filter({ rowChecked: true }).value();

        if (aSelectedRowsData.length === 0) {
          MessageBox.alert(this.getBundleText('MSG_46005')); // 데이터를 선택하여 주십시오.
          return;
        }

        oViewModel.setProperty('/busy', true);

        const sMessage = vPrcty === 'B' ? 'LABEL_00123' : 'LABEL_00124';

        // {승인|반려}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', sMessage), {
          onClose: async (sAction) => {
            if (MessageBox.Action.CANCEL === sAction) {
              oViewModel.setProperty('/busy', false);
              return;
            }

            try {
              await this.createApproval(aSelectedRowsData, vPrcty, sMessage);
            } catch (oError) {
              this.debug('Controller > Mobile-csrAppr-csr > processApproval Error', oError);

              AppUtils.handleError(oError);
            } finally {
              oViewModel.setProperty('/busy', false);
            }
          },
        });
      },

      nextStepStatus(sPrsta) {
        const iPrsta = _.toInteger(sPrsta);
        let sReturnStatus = '';

        switch (true) {
          case iPrsta === 10:
            sReturnStatus = '11';
            break;
          case iPrsta === 11:
            sReturnStatus = '12';
            break;
          case iPrsta >= 22:
            sReturnStatus = '30';
            break;
          default:
            sReturnStatus = sPrsta;
            break;
        }

        return sReturnStatus;
      },

      async createApproval(aSelectedData, vPrcty, sMessage) {
        const oModel = this.getModel(ServiceNames.COMMON);

        try {
          for (const el of aSelectedData) {
            el.Prcty = vPrcty;

            // 승인시 진행상태 값
            if (vPrcty === 'B') {
              el.Prsta = this.nextStepStatus(el.Prsta);
            }

            await Client.create(oModel, 'CsrRequestApproval', el);
          }

          // {승인|반려}되었습니다.
          MessageBox.alert(this.getBundleText('MSG_00007', sMessage), {
            onClose: () => this.retrieveList(),
          });
        } catch (oError) {
          throw oError;
        }
      },

      async onChangeSelect1(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const sSelectedValue = oEvent.getParameter('changedItem').getKey();

          oViewModel.setProperty('/search/select1', sSelectedValue);

          await this.retrieveList();
        } catch (oError) {
          this.debug('Controller > Mobile-csrAppr-csr > onChangeSelect1 Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onChangeSelect2(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          const sSelectedValue = oEvent.getParameter('changedItem').getKey();

          oViewModel.setProperty('/search/select2', sSelectedValue);

          await this.retrieveList();
        } catch (oError) {
          this.debug('Controller > Mobile-csrAppr-csr > onChangeSelect2 Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 날짜선택
      async onSearchRange() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setProperty('/busy', true);

          await this.retrieveList();
        } catch (oError) {
          this.debug('Controller > Mobile-csrAppr-csr > onSearchRange Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      // 검색 날짜 선택
      async onSearchList(oEvent) {
        const oViewModel = this.getViewModel();

        try {
          const sKey = oEvent.getSource().getSelectedKey();
          let dBegda = moment().toDate();
          let dEndda = moment().toDate();
          let bDateRangeBox = false;

          oViewModel.setProperty('/busy', true);

          switch (sKey) {
            case '1w':
              dEndda = moment().subtract(6, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '1m':
              dEndda = moment().subtract(1, 'months').add(1, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '3m':
              dEndda = moment().subtract(3, 'months').add(1, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '6m':
              dEndda = moment().subtract(6, 'months').add(1, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '12m':
              dEndda = moment().subtract(12, 'months').add(1, 'day').toDate();
              bDateRangeBox = false;
              break;
            case '0':
              bDateRangeBox = true;
              break;
          }

          if (!bDateRangeBox) {
            oViewModel.setProperty('/search/secondDate', dBegda);
            oViewModel.setProperty('/search/date', dEndda);

            await this.retrieveList();
          }

          oViewModel.setProperty('/search/dateBox', bDateRangeBox);
        } catch (oError) {
          this.debug('Controller > Mobile-csrAppr-csr > onSearchList Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      onSelectRow(oEvent) {
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const oRowData = this.getViewModel().getProperty(vPath);

        this.getRouter().navTo('mobile/csrAppr-detail', { appno: oRowData.Appno, werks: oRowData.Werks });
      },
    });
  }
);
