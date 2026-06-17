import * as Yup from 'yup'

export const schema = Yup.object().shape({
    email: Yup.string()
        .trim()
        .email('Valid email is required')
        .required('Email is required'),
    password: Yup.string().trim()
        .required('Password is required'),
})
