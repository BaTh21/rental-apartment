// src/pages/PaymentsPage.jsx
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import jsPDF from 'jspdf';
import { useState } from 'react';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import {
  createPayment,
  deletePayment,
  getPayments,
  getRentals,
  updatePayment,
} from '../api';
import { useAuth } from '../auth/AuthProvider';

// ✅ Validation schema
const paymentSchema = Yup.object({
  rental_id: Yup.number().required('Rental is required'),
  payment_date: Yup.date().required('Payment date is required'),
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  payment_method: Yup.string()
    .oneOf(['cash', 'credit', 'bank_transfer'])
    .required('Payment method is required'),
  status: Yup.string()
    .oneOf(['pending', 'completed', 'failed'])
    .required('Status is required'),
});

const PaymentsPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // ✅ Fetch data
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: getPayments,
  });

  const { data: rentals = [] } = useQuery({
    queryKey: ['rentals'],
    queryFn: getRentals,
  });

  // ✅ Mutations
  const createMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      toast.success('Payment created');
      setOpen(false);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error creating payment'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      toast.success('Payment updated');
      setOpen(false);
      setEditingItem(null);
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error updating payment'),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      toast.success('Payment deleted');
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'Error deleting payment'),
  });

  // ✅ PDF Invoice function
  const generatePDFInvoice = (payment) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Rental Payment Invoice', 105, 20, null, null, 'center');

    doc.setFontSize(12);
    doc.text(`Payment ID: ${payment.id}`, 20, 40);
    doc.text(`Tenant: ${payment.rental?.tenant?.user?.username || 'N/A'}`, 20, 50);
    doc.text(`Apartment: ${payment.rental?.apartment?.name || 'N/A'}`, 20, 60);
    doc.text(`Payment Date: ${payment.payment_date}`, 20, 70);
    doc.text(`Amount: $${payment.amount.toFixed(2)}`, 20, 80);
    doc.text(`Payment Method: ${payment.payment_method}`, 20, 90);
    doc.text(`Status: ${payment.status}`, 20, 100);

    doc.setFontSize(10);
    doc.text('Thank you for your payment!', 105, 120, null, null, 'center');

    doc.save(`invoice_${payment.id}.pdf`);
  };

  // ✅ Formik setup
  const formik = useFormik({
    initialValues: editingItem
      ? {
          rental_id: editingItem.rental?.id || '',
          payment_date: editingItem.payment_date || '',
          amount: editingItem.amount || '',
          payment_method: editingItem.payment_method || 'cash',
          status: editingItem.status || 'pending',
        }
      : {
          rental_id: '',
          payment_date: '',
          amount: '',
          payment_method: 'cash',
          status: 'pending',
        },
    enableReinitialize: true,
    validationSchema: paymentSchema,
    onSubmit: (values) => {
      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  // ✅ Columns for DataGrid
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'rental',
      headerName: 'Rental',
      width: 150,
      renderCell: (params) => params.row.rental?.apartment?.name || `Rental #${params.row.rental_id}`,
    },
    { field: 'payment_date', headerName: 'Payment Date', width: 150 },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      renderCell: (params) => `$${params.value.toFixed(2)}`,
    },
    { field: 'payment_method', headerName: 'Method', width: 150 },
    { field: 'status', headerName: 'Status', width: 130 },
    {
      field: 'invoice',
      headerName: 'Invoice',
      width: 120,
      sortable: false,
      renderCell: (params) =>
        params.row.status === 'completed' ? (
          <Button
            variant="outlined"
            size="small"
            onClick={() => generatePDFInvoice(params.row)}
          >
            PDF
          </Button>
        ) : null,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) =>
        user.role.name !== 'Tenant' ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              onClick={() => {
                setEditingItem({
                  ...params.row,
                  rental_id: params.row.rental?.id || '',
                });
                setOpen(true);
              }}
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, padding: '8px' }}
            >
              <EditIcon fontSize="small" />
            </Button>
            <Button
              color="error"
              onClick={() => {
                if (window.confirm('Delete this payment?')) {
                  deleteMutation.mutate(params.row.id);
                }
              }}
              variant="outlined"
              size="small"
              sx={{ minWidth: 0, padding: '8px' }}
            >
              <DeleteIcon fontSize="small" />
            </Button>
          </Box>
        ) : null,
    },
  ];

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 2,
          gap: 2,
        }}
      >
        <Typography variant="h4">Payments</Typography>
        {user.role.name !== 'Tenant' && (
          <Button
            variant="contained"
            onClick={() => {
              setEditingItem(null);
              formik.resetForm();
              setOpen(true);
            }}
          >
            Add Payment
          </Button>
        )}
      </Box>

      {/* DataGrid */}
      <Box sx={{ width: '100%', overflowX: 'auto' }}>
        <DataGrid
          rows={payments}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          loading={isLoading}
          autoHeight
          getRowId={(row) => row.id}
        />
      </Box>

      {/* Dialog Form */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingItem(null);
          formik.resetForm();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editingItem ? 'Edit Payment' : 'Create Payment'}</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              select
              label="Rental"
              name="rental_id"
              value={formik.values.rental_id}
              onChange={formik.handleChange}
              fullWidth
              disabled={!!editingItem}
              error={formik.touched.rental_id && !!formik.errors.rental_id}
              helperText={formik.touched.rental_id && formik.errors.rental_id}
            >
              {rentals.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.tenant?.user?.username || 'Unknown'}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Payment Date"
              name="payment_date"
              type="date"
              value={formik.values.payment_date}
              onChange={formik.handleChange}
              error={formik.touched.payment_date && !!formik.errors.payment_date}
              helperText={formik.touched.payment_date && formik.errors.payment_date}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              label="Amount"
              name="amount"
              type="number"
              value={formik.values.amount}
              onChange={formik.handleChange}
              error={formik.touched.amount && !!formik.errors.amount}
              helperText={formik.touched.amount && formik.errors.amount}
              fullWidth
            />

            <TextField
              select
              label="Payment Method"
              name="payment_method"
              value={formik.values.payment_method}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.payment_method && !!formik.errors.payment_method}
              helperText={formik.touched.payment_method && formik.errors.payment_method}
            >
              {['cash', 'credit', 'bank_transfer'].map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              name="status"
              value={formik.values.status}
              onChange={formik.handleChange}
              fullWidth
              error={formik.touched.status && !!formik.errors.status}
              helperText={formik.touched.status && formik.errors.status}
            >
              {['pending', 'completed', 'failed'].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={createMutation.isLoading || updateMutation.isLoading}
            >
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default PaymentsPage;
