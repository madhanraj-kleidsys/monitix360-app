import api from '../../../api/client';

const companyServices = {
    getCompanyById: async (companyId) => {
        try {
            const response = await api.get(`/CompanyDetails/${companyId}`);
            // console.log('✅ API Response:',response.data);
            return response.data;
        }
        catch(err){
            // res.status(500).json({"error in fetching company name" : err.message});
            console.error('Error fetching company:',err.message);
            return null;
        }
    }
};
export default companyServices;