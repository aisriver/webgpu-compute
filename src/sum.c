// sum.c
// int main() {
//     return 0;
// }

int sum(int *array, int size)
{
    int result = 0;
    for (int i = 0; i < size; i++)
    {
        result += array[i];
    }
    return result;
}
