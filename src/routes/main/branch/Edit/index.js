import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Grid,
  Switch,
  FormControlLabel,
  MenuItem,
} from '@mui/material';
import { useDispatch } from 'react-redux';

const EditBranch = ({ branch }) => {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    id: null,
    title: '',
    province: '',
    city: '',
    ip: '',
    description: '',
    address: '',
    phone: '',
    is_active: false,
    max_users: 0,
  });

  const [documents, setDocuments] = useState([]);

  const [provinces] = useState([
    { id: 1, name: 'تهران' },
    { id: 2, name: 'اصفهان' },
  ]);

  const [cities, setCities] = useState([]);

  // --------------------------------
  // fake API cities
  // --------------------------------
  const fetchCitiesByProvince = async (provinceId) => {
    const data = {
      1: [
        { id: 10, name: 'تهران' },
        { id: 11, name: 'اسلامشهر' },
      ],
      2: [
        { id: 20, name: 'اصفهان' },
        { id: 21, name: 'کاشان' },
      ],
    };

    return data[provinceId] || [];
  };

  // --------------------------------
  // load branch data
  // --------------------------------
  useEffect(() => {
    const load = async () => {
      if (!branch) return;

      setForm({
        id: branch.ID,
        title: branch.title || '',
        province: branch.province || '',
        city: branch.city || '',
        ip: branch.ip || '',
        description: branch.description || '',
        address: branch.address || '',
        phone: branch.phone || '',
        is_active: branch.is_active || false,
        max_users: branch.max_users || 0,
      });

      // 🔥 load cities based on province
      if (branch.province) {
        const cityList = await fetchCitiesByProvince(branch.province);
        setCities(cityList);
      }
    };

    load();
  }, [branch]);

  // --------------------------------
  // handle change
  // --------------------------------
  const handleChange = async (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // --------------------------------
    // 🔥 province changed
    // --------------------------------
    if (name === 'province') {
      setForm((prev) => ({
        ...prev,
        province: value,
        city: '', // reset city
      }));

      const cityList = await fetchCitiesByProvince(value);
      setCities(cityList);
    }
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      id: form.id,
      province: Number(form.province),
      city: Number(form.city),
      max_users: Number(form.max_users),
      documents,
    };

    console.log('Update Branch:', payload);

    // dispatch(updateBranch(payload));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          ویرایش شعبه
        </Typography>

        <Box component="form">
          <Grid container spacing={2}>
            {/* عنوان */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="عنوان"
                name="title"
                value={form.title}
                onChange={handleChange}
              />
            </Grid>

            {/* IP */}
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="IP" name="ip" value={form.ip} onChange={handleChange} />
            </Grid>

            {/* استان */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="استان"
                name="province"
                value={form.province}
                onChange={handleChange}
              >
                {provinces.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* شهر (وابسته) */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="شهر"
                name="city"
                value={form.city}
                onChange={handleChange}
                disabled={!form.province}
              >
                {cities.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* تلفن */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="تلفن"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </Grid>

            {/* max users */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="حداکثر کاربران"
                name="max_users"
                value={form.max_users}
                onChange={handleChange}
              />
            </Grid>

            {/* آدرس */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="آدرس"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </Grid>

            {/* توضیحات */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="توضیحات"
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </Grid>

            {/* فعال */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                }
                label="فعال / غیرفعال"
              />
            </Grid>

            {/* مدارک */}
            <Grid item xs={12}>
              <Button variant="outlined" component="label">
                تغییر مدارک
                <input
                  type="file"
                  hidden
                  multiple
                  onChange={(e) => setDocuments(Array.from(e.target.files))}
                />
              </Button>
            </Grid>

            {/* submit */}
            <Grid item xs={12}>
              <Button variant="contained" color="warning" onClick={handleSubmit}>
                ویرایش شعبه
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EditBranch;
