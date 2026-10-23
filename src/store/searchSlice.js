import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { requestGoods } from '../api/favoritParts'
import { extractBrands, buildRows } from '../lib/nomenclature'

// Действия:
// - по номеру детали ищем производителей (этап 1)
// - по выбранному производителю ищем аналогов (этап 2)

export const fetchBrands = createAsyncThunk(
  'search/fetchBrands',
  async ({ key, number }, { rejectWithValue }) => {
    try {
      const goods = await requestGoods({ key, number, info: 'on' })
      return extractBrands(goods)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const fetchAnalogues = createAsyncThunk(
  'search/fetchAnalogues',
  async ({ key, number, brand }, { rejectWithValue }) => {
    try {
      const goods = await requestGoods({ key, number, brand, analogues: 'on', info: 'on' })
      return buildRows(goods)
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const initialState = {
  number: '',
  brands: { status: 'idle', items: [], error: null },
  selectedBrand: null,
  analogues: { status: 'idle', rows: [], error: null }
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    numberChanged(state, action) {
      state.number = action.payload
      // При вводе нового артикула сбрасываем результаты, чтобы не показывать устаревшие
      state.brands.status = 'idle'
      state.brands.items = []
      state.brands.error = null
      state.selectedBrand = null
      state.analogues.status = 'idle'
      state.analogues.rows = []
      state.analogues.error = null
    },
    brandSelected(state, action) {
      state.selectedBrand = action.payload
      state.analogues.status = 'idle'
      state.analogues.rows = []
      state.analogues.error = null
    },
    searchReset(state) {
      state.number = ''
      state.brands = { status: 'idle', items: [], error: null }
      state.selectedBrand = null
      state.analogues = { status: 'idle', rows: [], error: null }
    }
  },
  extraReducers(builder) {
    // --- Этап 1: бренды ---
    builder
      .addCase(fetchBrands.pending, (state) => {
        state.brands.status = 'loading'
        state.brands.error = null
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.brands.status = 'succeeded'
        state.brands.items = action.payload
        // Сбрасываем этап 2 при смене результата поиска
        state.selectedBrand = null
        state.analogues.status = 'idle'
        state.analogues.rows = []
        state.analogues.error = null
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.brands.status = 'failed'
        state.brands.error = action.payload ?? 'Не удалось загрузить список производителей.'
      })

    // --- Этап 2: аналоги ---
    builder
      .addCase(fetchAnalogues.pending, (state) => {
        state.analogues.status = 'loading'
        state.analogues.error = null
      })
      .addCase(fetchAnalogues.fulfilled, (state, action) => {
        state.analogues.status = 'succeeded'
        state.analogues.rows = action.payload
      })
      .addCase(fetchAnalogues.rejected, (state, action) => {
        state.analogues.status = 'failed'
        state.analogues.error = action.payload ?? 'Не удалось загрузить аналоги.'
      })
  }
})

export const { numberChanged, brandSelected, searchReset } = searchSlice.actions

export const store = configureStore({
  reducer: { search: searchSlice.reducer }
})
