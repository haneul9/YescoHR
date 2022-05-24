/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/Fragment',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/Appno',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    Fragment,
    MessageBox,
    Appno,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.housingLoan.HousingLoanRepayment', {
      LIST_PAGE_ID: 'container-ehr---housingLoanDetail',

      initializeModel() {
        return {
          ViewKey: '',
          AccountTxt: '',
          DialogData: {},
          FormData: {},
          Settings: {},
          TargetLoanHis: {},
          LoanAppList: [],
          maxDate: moment().toDate(),
          DateEditable: true,
        };
      },

      onObjectMatched(oParameter) {
        const sDataKey = oParameter.oDataKey;

        if (!sDataKey) {
          MessageBox.alert(this.getBundleText('MSG_00043'), {
            onClose: () => {
              this.getRouter().navTo('housingLoan');
            },
          });
        }

        const oViewModel = this.getViewModel();
        oViewModel.setData(this.initializeModel());
        // Input Field Imited
        oViewModel.setProperty('/FieldLimit', _.assignIn(this.getEntityLimit(ServiceNames.BENEFIT, 'LoanRepayAppl')));

        if (!!oParameter.lonid) {
          const sLonid = oParameter.lonid;

          oViewModel.setProperty('/ViewLonid', sLonid);
        }

        oViewModel.setProperty('/ViewKey', sDataKey);

        this.getList();
      },

      formatAmount(sAmount) {
        return this.TextUtils.toCurrency(!_.parseInt(sAmount) ? 0 : sAmount);
      },

      getCurrentLocationText() {
        return this.getBundleText('LABEL_07034');
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR08';
      },

      // 원금상환액
      repayCost(oEvent) {
        const oEventSource = oEvent.getSource();
        const sValue = oEvent.getParameter('value').trim().replace(/[^\d]/g, '');
        const oViewModel = this.getViewModel();
        const iPayIntrest = parseInt(oViewModel.getProperty('/DialogData/RpamtMin'));
        const iRepay = parseInt(sValue);

        if (iRepay > parseInt(oViewModel.getProperty('/TargetLoanHis/RpamtBal'))) {
          const sBeforeRepay = oViewModel.getProperty('/DialogData/RpamtMpr');

          oEventSource.setValue(this.TextUtils.toCurrency(sBeforeRepay));
          oViewModel.setProperty('/DialogData/RpamtMpr', sBeforeRepay);
          MessageBox.alert(this.getBundleText('MSG_07004'));
        } else {
          oEventSource.setValue(sValue);
          oViewModel.setProperty('/DialogData/RpamtMpr', sValue);
          oViewModel.setProperty('/DialogData/RpamtTot', String(iRepay + iPayIntrest));
        }
      },

      // DialogData setting
      async setInitDialogData() {
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
        const mDetailData = oListView.getModel().getProperty('/FormData');
        const oViewModel = this.getViewModel();
        const mTargetLoan = oViewModel.getProperty('/TargetLoanHis');
        const aAccountTxt = oViewModel.getProperty('/AccountTxt');

        oViewModel.setProperty('/DialogData', _.cloneDeep(mDetailData));
        oViewModel.setProperty('/DialogData/Appda', new Date());
        oViewModel.setProperty('/DialogData/Appno', '');
        oViewModel.setProperty('/DialogData/Lnsta', '');
        oViewModel.setProperty('/DialogData/Lnstatx', '');
        oViewModel.setProperty('/DialogData/Rptyp', 'ALL');
        oViewModel.setProperty('/DialogData/Paydt', new Date());
        oViewModel.setProperty('/DialogData/Lnrte', mTargetLoan.Lnrte);
        oViewModel.setProperty('/DialogData/RpamtMpr', mTargetLoan.RpamtBal);
        oViewModel.setProperty('/DialogData/RpamtTot', mTargetLoan.RpamtBal);
        oViewModel.setProperty(
          '/DialogData/Account',
          !_.find(aAccountTxt, (e) => {
            return !e.Zbigo;
          })
            ? _.find(aAccountTxt, (e) => {
                return e.Zbigo === mTargetLoan.Lntyp.slice(0, 1);
              }).Ztext
            : _.find(aAccountTxt, (e) => {
                return !e.Zbigo;
              }).Ztext
        );
        oViewModel.setProperty('/DateEditable', true);
      },

      // 상환신청내역 Excel
      onPressExcelDownload() {
        const oTable = this.byId('repaymentTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_07036');

        this.TableUtils.export({ oTable, sFileName });
      },

      // Dialog 닫기
      onClose() {
        this.byId('RepayApplyDialog').close();
      },

      // 상환신청내역 클릭
      async onSelectRow(oEvent) {
        const oViewModel = this.getViewModel();
        let oRowData = '';

        if (!oEvent.Appno) {
          const vPath = oEvent.getParameters().rowBindingContext.getPath();
          oRowData = _.cloneDeep(oViewModel.getProperty(vPath));
        } else {
          oRowData = _.cloneDeep(oEvent);
        }

        this.getRepayType(oRowData.Lnsta);

        const mTargetLoan = oViewModel.getProperty('/TargetLoanHis');
        const aAccountTxt = oViewModel.getProperty('/AccountTxt');

        if (!this.byId('RepayApplyDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.housingLoan.fragment.RepayApplyDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            oViewModel.setProperty('/DialogData', oRowData);
            oViewModel.setProperty(
              '/DialogData/Account',
              !_.find(aAccountTxt, (e) => {
                return !e.Zbigo;
              })
                ? _.find(aAccountTxt, (e) => {
                    return e.Zbigo === mTargetLoan.Lntyp.slice(0, 1);
                  }).Ztext
                : _.find(aAccountTxt, (e) => {
                    return !e.Zbigo;
                  }).Ztext
            );
            oViewModel.setProperty('/DateEditable', oRowData.Rptyp === 'FULL');
            this.settingsAttachTable();
            oDialog.open();
          });
        } else {
          oViewModel.setProperty('/DialogData', oRowData);
          oViewModel.setProperty(
            '/DialogData/Account',
            !_.find(aAccountTxt, (e) => {
              return !e.Zbigo;
            })
              ? _.find(aAccountTxt, (e) => {
                  return e.Zbigo === mTargetLoan.Lntyp.slice(0, 1);
                }).Ztext
              : _.find(aAccountTxt, (e) => {
                  return !e.Zbigo;
                }).Ztext
          );
          oViewModel.setProperty('/DateEditable', oRowData.Rptyp === 'FULL');
          this.settingsAttachTable();
          this.byId('RepayApplyDialog').open();
        }
      },

      // 통합 신청함에서 바로 들어올 경우 상세조회 호출
      repayDetail() {
        const oModel = this.getModel(ServiceNames.BENEFIT);

        return Client.getEntitySet(oModel, 'LoanAmtAppl', {
          Appbox: 'X',
          Pernr: this.getAppointeeProperty('Pernr'),
          Menid: this.getCurrentMenuId(),
          Prcty: 'D',
          Appno: this.getViewModel().getProperty('/ViewLonid'),
          LoanAmtHistorySet: [],
          LoanAmtRecordSet: [],
        });
      },

      // 화면관련 List호출
      async getList() {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const oAppointeeData = this.getAppointeeData();
        const oView = this.getView();
        const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
        const bRouteAppBox = !!oListView && oListView.getModel().getProperty('/FormData');
        let mDetailData = '';

        if (bRouteAppBox) {
          mDetailData = oListView.getModel().getProperty('/FormData');
        } else {
          mDetailData = await this.repayDetail();
        }

        const [oAmountTxt, [oHis], oAppList] = await Promise.all([
          // 입금계좌
          Client.getEntitySet(oModel, 'BenefitCodeList', {
            Cdnum: 'BE0015',
            Werks: oAppointeeData.Werks,
            Datum: new Date(),
            Grcod: 'BE000003',
            Sbcod: 'IN',
            Comcd: 'BANK',
          }),
          // 융자내역
          Client.getEntitySet(oModel, 'LoanRepayHistory', {
            Lonid: mDetailData.Lonid,
            Lntyp: mDetailData.Lntyp,
          }),
          // 신청내역
          Client.getEntitySet(oModel, 'LoanRepayAppl', {
            Lonid: mDetailData.Lonid,
            Lntyp: mDetailData.Lntyp,
            Prcty: 'L',
          }),
        ]);

        const sText = oAmountTxt[0].Ztext;
        const sRedText = `<span style='color:red;'>${this.getBundleText('MSG_07020')}</span>`;
        const sText2 = _.size(oAmountTxt) === 2 ? `<p style='margin-left:59px'>${oAmountTxt[1].Ztext}</p>` : '';

        oViewModel.setProperty('/AccountTxt', oAmountTxt);
        oViewModel.setProperty(
          '/InfoMessage',
          `<p>${this.getBundleText('MSG_07014')}</p>
          <p>${this.getBundleText('MSG_07018', sText)}</p>
          ${sText2}
          <p>${this.getBundleText('MSG_07019', sRedText)}</p>`
        );
        oViewModel.setProperty('/TargetLoanHis', oHis);

        const oTable = this.byId('repaymentTable');

        oViewModel.setProperty('/LoanAppList', oAppList);

        setTimeout(() => {
          oViewModel.setProperty('/listInfo', this.TableUtils.count({ oTable, aRowData: oAppList, sStatCode: 'Lnsta' }));

          if (!bRouteAppBox) {
            this.onSelectRow(_.each(oAppList, (v) => (v.Appno = oViewModel.getProperty('/ViewKey')))[0]);
          }
        }, 100);
      },

      // 상환유형 Code호출
      async getRepayType(sLnsta) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const oAppointeeData = this.getAppointeeData();

        let aList = await Client.getEntitySet(oModel, 'BenefitCodeList', {
          Cdnum: 'BE0016',
          Werks: oAppointeeData.Werks,
          Datum: new Date(),
        });

        if (!sLnsta || sLnsta === '10') {
          aList = _.filter(aList, (e) => {
            return e.Zcode !== 'PAY';
          });
        }

        oViewModel.setProperty('/LaonType', new ComboEntry({ codeKey: 'Zcode', valueKey: 'Ztext', aEntries: aList }));
      },

      // 상환유형선택
      onLaonType(oEvent) {
        const sKey = oEvent.getSource().getSelectedKey();
        const oViewModel = this.getViewModel();

        if (sKey === 'ALL') {
          return;
        } else if (sKey === 'FULL') {
          oViewModel.setProperty('/maxDate', moment('9999.12.31').toDate());
          oViewModel.setProperty('/DialogData/Paydt', moment().toDate());
        } else {
          oViewModel.setProperty('/maxDate', moment().toDate());
        }

        this.setLoanType('Type', sKey);
      },

      // 상환일 선택
      onPayDateChange(oEvent) {
        const sDateValue = oEvent.getSource().getDateValue();

        if (this.getViewModel().getProperty('/DialogData/Rptyp') === 'ALL') return;

        this.setLoanType('Date', sDateValue);
      },

      // 상환에따른 데이터셋팅
      async setLoanType(sType, sKey) {
        const oModel = this.getModel(ServiceNames.BENEFIT);
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');
        let sKey1 = '';
        let sDate = '';

        if (sType === 'Type') {
          sKey1 = sKey;
          sDate = mDialogData.Paydt;
        } else {
          sKey1 = mDialogData.Rptyp;
          sDate = sKey;
        }

        let mPayload = {
          // prettier 방지주석
          Lonid: mDialogData.Lonid,
          Lntyp: mDialogData.Lntyp,
          Rptyp: sKey1,
        };
        if (sKey1 === 'FULL') {
          _.chain(mPayload).set('Paydt', moment(sDate).hours(9).toDate()).set('RpamtMpr', oViewModel.getProperty('/TargetLoanHis/RpamtBal')).value();
          oViewModel.setProperty('/DateEditable', true);
        } else {
          oViewModel.setProperty('/DateEditable', false);
        }

        const [oAmount] = await Client.getEntitySet(oModel, 'LoanRepayCheck', mPayload);

        if (sType === 'Type' && sKey !== 'FULL') {
          oViewModel.setProperty('/DialogData/Paydt', oAmount.Paydt);
        }

        oViewModel.setProperty('/DialogData/RpamtMpr', oAmount.RpamtMpr);
        oViewModel.setProperty('/DialogData/RpamtMin', oAmount.RpamtMin);
        oViewModel.setProperty('/DialogData/RpamtTot', oAmount.RpamtTot);
      },

      // 상환신청
      async onRepayDetailApp() {
        this.getRepayType('');
        this.setInitDialogData();

        if (!this.byId('RepayApplyDialog')) {
          Fragment.load({
            id: this.getView().getId(),
            name: 'sap.ui.yesco.mvc.view.housingLoan.fragment.RepayApplyDialog',
            controller: this,
          }).then(async (oDialog) => {
            // connect dialog to the root view of this component (models, lifecycle)
            this.getView().addDependent(oDialog);
            this.settingsAttachTable();

            oDialog.open();
          });
        } else {
          this.settingsAttachTable();
          this.byId('RepayApplyDialog').open();
        }
      },

      // 상환신청
      onRepayApp() {
        const sAppno = this.getViewModel().getProperty('/FormData/Appno');

        this.getRouter().navTo('housingLoan-repay', { oDataKey: sAppno });
      },

      checkError(sType) {
        const oViewModel = this.getViewModel();
        const mDialogData = oViewModel.getProperty('/DialogData');

        // 상환유형
        if (mDialogData.Rptyp === 'ALL' || !mDialogData.Rptyp) {
          MessageBox.alert(this.getBundleText('MSG_07015'));
          return true;
        }

        // 상환일
        if (!mDialogData.Paydt) {
          MessageBox.alert(this.getBundleText('MSG_07016'));
          return true;
        }

        // 상환일
        if (sType === 'C' && mDialogData.Paydt > moment().toDate() && mDialogData.Rptyp === 'FULL') {
          MessageBox.alert(this.getBundleText('MSG_07003'));
          return true;
        }

        // 원금상환액
        if (!mDialogData.RpamtMpr || _.parseInt(mDialogData.RpamtMpr) === 0) {
          MessageBox.alert(this.getBundleText('MSG_07017'));
          return true;
        }

        // 첨부파일
        if (!this.AttachFileAction.getFileCount.call(this)) {
          MessageBox.alert(this.getBundleText('MSG_00046'));
          return true;
        }

        return false;
      },

      // 재작성
      onRewriteBtn() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/DialogData/Appno', '');
        oViewModel.setProperty('/DialogData/Lnsta', '');
        this.settingsAttachTable();
      },

      // 임시저장
      onSaveBtn() {
        if (this.checkError()) return;

        // {저장}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00103'), {
          // 저장, 취소
          actions: [this.getBundleText('LABEL_00103'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 저장
            if (!vPress || vPress !== this.getBundleText('LABEL_00103')) {
              return;
            }

            const oRepayDialog = this.byId('RepayApplyDialog');

            try {
              oRepayDialog.setBusy(true);

              const oViewModel = this.getViewModel();
              const mDialogData = oViewModel.getProperty('/DialogData');

              if (!mDialogData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(mDialogData).set('Appno', sAppno).set('Appda', new Date()).set('Seqnr', '').value();
              }

              // FileUpload
              await this.AttachFileAction.uploadFile.call(this, mDialogData.Appno, this.getApprovalType());

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mDialogData,
                Prcty: 'T',
                Waers: 'KRW',
              };

              await Client.create(oModel, 'LoanRepayAppl', mSendObject);

              // {저장}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00103'), {
                onClose: () => {
                  this.getList();
                  this.byId('RepayApplyDialog').close();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              oRepayDialog.setBusy(false);
            }
          },
        });
      },

      // 신청
      onApplyBtn() {
        if (this.checkError('C')) return;

        // {신청}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00121'), {
          // 신청, 취소
          actions: [this.getBundleText('LABEL_00121'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 신청
            if (!vPress || vPress !== this.getBundleText('LABEL_00121')) {
              return;
            }

            const oRepayDialog = this.byId('RepayApplyDialog');

            try {
              oRepayDialog.setBusy(true);

              const oViewModel = this.getViewModel();
              const mDialogData = oViewModel.getProperty('/DialogData');

              if (!mDialogData.Appno) {
                const sAppno = await Appno.get.call(this);

                _.chain(mDialogData).set('Appno', sAppno).set('Appda', new Date()).set('Seqnr', '').value();
              }

              // FileUpload
              await this.AttachFileAction.uploadFile.call(this, mDialogData.Appno, this.getApprovalType());

              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...mDialogData,
                Prcty: 'C',
                Waers: 'KRW',
              };

              await Client.create(oModel, 'LoanRepayAppl', mSendObject);

              // {신청}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00121'), {
                onClose: () => {
                  this.getList();
                  this.byId('RepayApplyDialog').close();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              oRepayDialog.setBusy(false);
            }
          },
        });
      },

      // 취소
      onCancelBtn() {
        // {취소}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00118'), {
          // 확인, 취소
          actions: [this.getBundleText('LABEL_00114'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 취소
            if (!vPress || vPress !== this.getBundleText('LABEL_00114')) {
              return;
            }

            const oRepayDialog = this.byId('RepayApplyDialog');

            oRepayDialog.setBusy(true);

            try {
              const oViewModel = this.getViewModel();
              const oModel = this.getModel(ServiceNames.BENEFIT);
              const mSendObject = {
                ...oViewModel.getProperty('/DialogData'),
                Prcty: 'W',
              };

              await Client.create(oModel, 'LoanRepayAppl', mSendObject);

              // {취소}되었습니다.
              MessageBox.alert(this.getBundleText('MSG_00039', 'LABEL_00121'), {
                onClose: () => {
                  this.getList();
                  this.byId('RepayApplyDialog').close();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              oRepayDialog.setBusy(false);
            }
          },
        });
      },

      // 삭제
      onDeleteBtn() {
        // {삭제}하시겠습니까?
        MessageBox.confirm(this.getBundleText('MSG_00006', 'LABEL_00110'), {
          // 삭제, 취소
          actions: [this.getBundleText('LABEL_00110'), this.getBundleText('LABEL_00118')],
          onClose: async (vPress) => {
            // 삭제
            if (!vPress || vPress !== this.getBundleText('LABEL_00110')) {
              return;
            }

            const oRepayDialog = this.byId('RepayApplyDialog');

            oRepayDialog.setBusy(true);

            try {
              const oModel = this.getModel(ServiceNames.BENEFIT);
              const oViewModel = this.getViewModel();

              await Client.remove(oModel, 'LoanRepayAppl', _.pick(oViewModel.getProperty('/DialogData'), ['Lonid', 'Seqnr']));

              // {삭제}되었습니다
              MessageBox.alert(this.getBundleText('MSG_00007', 'LABEL_00110'), {
                onClose: () => {
                  this.getList();
                  this.byId('RepayApplyDialog').close();
                },
              });
            } catch (oError) {
              AppUtils.handleError(oError);
            } finally {
              oRepayDialog.setBusy(false);
            }
          },
        });
      },

      // AttachFileTable Settings
      settingsAttachTable() {
        const oViewModel = this.getViewModel();
        const sStatus = oViewModel.getProperty('/DialogData/Lnsta');
        const sAppno = oViewModel.getProperty('/DialogData/Appno') || '';

        this.AttachFileAction.setAttachFile(this, {
          Editable: !sStatus || sStatus === '10',
          Type: this.getApprovalType(),
          Appno: sAppno,
          Max: 1,
        });
      },
    });
  }
);
